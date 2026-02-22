import { ok, toApiError } from "@/lib/api";
import { listCourses } from "@/lib/repos/coursesRepo";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [courses, roundsRes] = await Promise.all([
      listCourses(),
      supabase.from("rounds").select("*").order("played_at", { ascending: true }),
    ]);

    if (roundsRes.error) throw roundsRes.error;

    return ok({
      exportedAt: new Date().toISOString(),
      courses,
      rounds: roundsRes.data ?? [],
    });
  } catch (error) {
    return toApiError(error);
  }
}
