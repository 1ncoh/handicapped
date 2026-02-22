import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedPlayers() {
  const { error } = await supabase.from("players").upsert(
    [
      { id: "randall", name: "Randall" },
      { id: "jaden", name: "Jaden" },
    ],
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function seedCourses() {
  const demo = [
    { name: "Pebble Dunes", tee: "Blue", holes: 18, course_rating: 72.4, slope_rating: 138, par: 72 },
    { name: "Canyon Ridge", tee: "White", holes: 18, course_rating: 69.8, slope_rating: 125, par: 71 },
    { name: "Lakeside Links", tee: "Gold", holes: 9, course_rating: 35.2, slope_rating: 118, par: 36 },
  ];

  const { data: existing, error: existingError } = await supabase.from("courses").select("id, name, tee");
  if (existingError) throw existingError;

  const toInsert = demo.filter(
    (course) => !(existing ?? []).some((row) => row.name === course.name && row.tee === course.tee),
  );

  if (toInsert.length > 0) {
    const { error } = await supabase.from("courses").insert(toInsert);
    if (error) throw error;
  }

  const { data: allCourses, error: listError } = await supabase.from("courses").select("id, name");
  if (listError) throw listError;
  return allCourses ?? [];
}

async function seedRounds(courseRows: Array<{ id: string; name: string }>) {
  const { count, error: countError } = await supabase
    .from("rounds")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  const pebble = courseRows.find((row) => row.name === "Pebble Dunes");
  const canyon = courseRows.find((row) => row.name === "Canyon Ridge");
  const lakeside = courseRows.find((row) => row.name === "Lakeside Links");

  if (!pebble || !canyon || !lakeside) return;

  const rounds = [
    {
      player_id: "randall",
      played_at: "2026-01-05",
      course_id: pebble.id,
      holes: 18,
      score: 92,
      putts: 35,
      gir: 6,
      fir: 7,
      three_putts: 2,
      pcc: 0,
      notes: "Windy day",
    },
    {
      player_id: "randall",
      played_at: "2026-01-14",
      course_id: lakeside.id,
      holes: 9,
      score: 44,
      putts: 17,
      gir: 3,
      fir: 4,
      three_putts: 1,
      pcc: 0,
      notes: null,
    },
    {
      player_id: "randall",
      played_at: "2026-01-21",
      course_id: lakeside.id,
      holes: 9,
      score: 46,
      putts: 18,
      gir: 2,
      fir: 3,
      three_putts: 1,
      pcc: 0,
      notes: null,
    },
    {
      player_id: "jaden",
      played_at: "2026-01-08",
      course_id: canyon.id,
      holes: 18,
      score: 88,
      putts: 33,
      gir: 8,
      fir: 9,
      three_putts: 1,
      pcc: 0,
      notes: null,
    },
  ];

  const { error } = await supabase.from("rounds").insert(rounds);
  if (error) throw error;
}

async function main() {
  await seedPlayers();
  const courses = await seedCourses();
  await seedRounds(courses);
  console.log("Seed completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
