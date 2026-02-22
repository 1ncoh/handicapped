import fs from "node:fs";
import path from "node:path";

import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const rowSchema = z.object({
  Player: z.string().min(1),
  Date: z.string().min(1),
  Course: z.string().min(1),
  Rating: z.coerce.number().min(40).max(90).or(z.coerce.number().min(20).max(45)),
  Slope: z.coerce.number().int().min(55).max(200),
  Holes: z.coerce.number().int().refine((v) => v === 9 || v === 18, "Holes must be 9 or 18"),
  Total: z.coerce.number().int().min(20).max(200),
  Tee: z.string().optional(),
  Par: z.coerce.number().int().optional(),
  PCC: z.coerce.number().int().optional(),
  Notes: z.string().optional(),
});

type RawRow = z.infer<typeof rowSchema>;

type CourseRow = {
  id: string;
  name: string;
  tee: string;
  holes: number;
  course_rating: number;
  slope_rating: number;
  par: number;
};

function normalizePlayer(input: string): "randall" | "jaden" {
  const value = input.trim().toLowerCase();
  if (value === "randall") return "randall";
  if (value === "jaden") return "jaden";
  throw new Error(`Unsupported player: ${input}`);
}

function normalizeDate(input: string): string {
  const trimmed = input.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const mdY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!mdY) {
    throw new Error(`Unsupported date format: ${input}`);
  }

  const month = Number(mdY[1]);
  const day = Number(mdY[2]);
  const year = Number(mdY[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date: ${input}`);
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function detectDelimiter(content: string) {
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  return firstLine.includes("\t") ? "\t" : ",";
}

function normalizeHeader(input: string) {
  return input.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function canonicalizeRow(row: Record<string, string>) {
  const byKey = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    byKey.set(normalizeHeader(key), value);
  }

  const read = (...aliases: string[]) => {
    for (const alias of aliases) {
      const value = byKey.get(alias);
      if (value != null && value !== "") return value;
    }
    return undefined;
  };

  return {
    Player: read("player"),
    Date: read("date", "played_at", "playedat"),
    Course: read("course", "course_name"),
    Rating: read("rating", "course_rating"),
    Slope: read("slope", "slope_rating", "slipe"),
    Holes: read("holes"),
    Total: read("total", "score"),
    Tee: read("tee"),
    Par: read("par"),
    PCC: read("pcc"),
    Notes: read("notes", "note"),
  };
}

function toCourseMatchKey(input: {
  name: string;
  tee: string;
  holes: number;
  rating: number;
  slope: number;
}) {
  return [
    input.name.trim().toLowerCase(),
    input.tee.trim().toLowerCase(),
    input.holes,
    Number(input.rating.toFixed(1)),
    input.slope,
  ].join("|");
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    throw new Error("Usage: npm run import:rounds -- <path-to-csv-or-tsv>");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const absolutePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  const delimiter = detectDelimiter(raw);

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
  }) as Record<string, string>[];

  if (records.length === 0) {
    throw new Error("Input file has no rows");
  }

  const parsedRows: RawRow[] = records.map((row, idx) => {
    const canonical = canonicalizeRow(row);
    const parsed = rowSchema.safeParse(canonical);
    if (!parsed.success) {
      throw new Error(
        `Row ${idx + 2} failed validation: ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "row"} ${i.message}`)
          .join(", ")}`,
      );
    }
    return parsed.data;
  });

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingCourses, error: existingCoursesError } = await supabase
    .from("courses")
    .select("id,name,tee,holes,course_rating,slope_rating,par");
  if (existingCoursesError) throw existingCoursesError;

  const courseByKey = new Map<string, CourseRow>();
  for (const course of (existingCourses ?? []) as CourseRow[]) {
    const key = toCourseMatchKey({
      name: course.name,
      tee: course.tee,
      holes: course.holes,
      rating: Number(course.course_rating),
      slope: course.slope_rating,
    });
    courseByKey.set(key, course);
  }

  let createdCourses = 0;
  let insertedRounds = 0;
  let skippedRounds = 0;

  for (const row of parsedRows) {
    const courseName = row.Course.trim();
    const tee = row.Tee?.trim() || "Standard";
    const holes = Number(row.Holes) as 9 | 18;
    const rating = Number(Number(row.Rating).toFixed(1));
    const slope = Number(row.Slope);
    const par = row.Par ?? (holes === 18 ? 72 : 36);

    const courseKey = toCourseMatchKey({ name: courseName, tee, holes, rating, slope });
    let course = courseByKey.get(courseKey);

    if (!course) {
      const { data: created, error: createCourseError } = await supabase
        .from("courses")
        .insert({
          name: courseName,
          tee,
          holes,
          course_rating: rating,
          slope_rating: slope,
          par,
        })
        .select("id,name,tee,holes,course_rating,slope_rating,par")
        .single();

      if (createCourseError) throw createCourseError;
      course = created as CourseRow;
      courseByKey.set(courseKey, course);
      createdCourses += 1;
    }

    const playerId = normalizePlayer(row.Player);
    const playedAt = normalizeDate(row.Date);
    const score = Number(row.Total);
    const pcc = row.PCC ?? 0;
    const notes = row.Notes?.trim() || null;

    const { data: existingRound, error: existingRoundError } = await supabase
      .from("rounds")
      .select("id")
      .eq("player_id", playerId)
      .eq("played_at", playedAt)
      .eq("course_id", course.id)
      .eq("holes", holes)
      .eq("score", score)
      .maybeSingle();

    if (existingRoundError) throw existingRoundError;
    if (existingRound) {
      skippedRounds += 1;
      continue;
    }

    const { error: insertRoundError } = await supabase.from("rounds").insert({
      player_id: playerId,
      played_at: playedAt,
      course_id: course.id,
      holes,
      score,
      pcc,
      notes,
    });

    if (insertRoundError) throw insertRoundError;
    insertedRounds += 1;
  }

  console.log(
    `Import complete. rows=${parsedRows.length}, createdCourses=${createdCourses}, insertedRounds=${insertedRounds}, skippedRounds=${skippedRounds}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
