import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Round, RoundWithCourse } from "@/lib/types";

type RoundInsert = Omit<
  Round,
  "id" | "created_at" | "updated_at" | "putts" | "gir" | "fir" | "three_putts" | "notes"
> & {
  putts?: number | null;
  gir?: number | null;
  fir?: number | null;
  three_putts?: number | null;
  notes?: string | null;
};

export async function listRoundsByPlayer(
  playerId: string,
  options?: { limit?: number; courseId?: string },
): Promise<RoundWithCourse[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("rounds")
    .select("*, course:courses(*)")
    .eq("player_id", playerId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.courseId) {
    query = query.eq("course_id", options.courseId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RoundWithCourse[];
}

export async function createRound(input: RoundInsert): Promise<Round> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("rounds").insert(input).select("*").single();

  if (error) throw error;
  return data as Round;
}

export async function updateRound(
  roundId: string,
  input: Partial<RoundInsert>,
): Promise<Round> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("rounds")
    .update(input)
    .eq("id", roundId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Round;
}

export async function deleteRound(roundId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("rounds").delete().eq("id", roundId);
  if (error) throw error;
}

export async function getRoundWithCourse(roundId: string): Promise<RoundWithCourse | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("rounds")
    .select("*, course:courses(*)")
    .eq("id", roundId)
    .maybeSingle();

  if (error) throw error;
  return (data as RoundWithCourse | null) ?? null;
}
