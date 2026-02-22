"use client";

import Link from "next/link";
import { useState } from "react";
import { useEffect } from "react";

import { CourseFormDialog, type CourseSeed } from "@/components/course-form-dialog";
import { CourseSearchPanel } from "@/components/course-search-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCourses } from "@/lib/apiClient";
import type { Course } from "@/lib/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<CourseSeed | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchCourses();
      setCourses(data.courses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteCourse(courseId: string) {
    if (!window.confirm("Delete this course? Rounds referencing it must be removed first.")) return;

    const response = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error?.message ?? "Failed to delete course");
      return;
    }

    await load();
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/" className="text-sm text-lime-800 underline">
            Back home
          </Link>
          <h1 className="text-3xl font-bold">Courses</h1>
        </div>

        <CourseFormDialog onSaved={load} seed={seed} onSeedApplied={() => setSeed(null)} />
      </div>

      {error ? <Alert className="mb-4 border-red-300 bg-red-50 text-red-900">{error}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Saved courses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-zinc-500">Loading courses...</p> : null}

              {!loading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Tee</TableHead>
                      <TableHead>Holes</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Slope</TableHead>
                      <TableHead>Par</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.tee}</TableCell>
                        <TableCell>{course.holes}</TableCell>
                        <TableCell>{course.course_rating.toFixed(1)}</TableCell>
                        <TableCell>{course.slope_rating}</TableCell>
                        <TableCell>{course.par}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <CourseFormDialog course={course} onSaved={load} triggerLabel="Edit" />
                            <Button variant="destructive" size="sm" onClick={() => deleteCourse(course.id)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}

              {!loading && courses.length === 0 ? <p className="text-sm text-zinc-500">No courses yet.</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <CourseSearchPanel onPick={(nextSeed) => setSeed(nextSeed)} />
        </div>
      </div>
    </main>
  );
}
