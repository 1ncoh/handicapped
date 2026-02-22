import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Course } from "@/lib/types";

export async function listCourses(): Promise<Course[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("courses").select("*").order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function createCourse(input: Omit<Course, "id" | "created_at" | "updated_at">) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("courses").insert(input).select("*").single();

  if (error) throw error;
  return data as Course;
}

export async function updateCourse(
  courseId: string,
  input: Partial<Omit<Course, "id" | "created_at" | "updated_at">>,
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("courses")
    .update(input)
    .eq("id", courseId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(courseId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw error;
}
