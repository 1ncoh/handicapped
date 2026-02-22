"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Course } from "@/lib/types";

type CoursePayload = {
  name: string;
  tee: string;
  holes: 9 | 18;
  course_rating: number;
  slope_rating: number;
  par: number;
};

export type CourseSeed = {
  name: string;
  tee: string;
  holes: 9 | 18;
  course_rating: number;
  slope_rating: number;
  par: number;
};

export function CourseFormDialog({
  onSaved,
  course,
  triggerLabel,
  seed,
  onSeedApplied,
}: {
  onSaved: () => Promise<void> | void;
  course?: Course;
  triggerLabel?: string;
  seed?: CourseSeed | null;
  onSeedApplied?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: course?.name ?? "",
    tee: course?.tee ?? "",
    holes: String(course?.holes ?? 18),
    course_rating: String(course?.course_rating ?? ""),
    slope_rating: String(course?.slope_rating ?? ""),
    par: String(course?.par ?? ""),
  });

  useEffect(() => {
    if (seed && !course) {
      setForm({
        name: seed.name,
        tee: seed.tee,
        holes: String(seed.holes),
        course_rating: String(seed.course_rating),
        slope_rating: String(seed.slope_rating),
        par: String(seed.par),
      });
      onSeedApplied?.();
      setOpen(true);
    }
  }, [seed, course, onSeedApplied]);

  useEffect(() => {
    if (!open) {
      setForm({
        name: course?.name ?? "",
        tee: course?.tee ?? "",
        holes: String(course?.holes ?? 18),
        course_rating: String(course?.course_rating ?? ""),
        slope_rating: String(course?.slope_rating ?? ""),
        par: String(course?.par ?? ""),
      });
      setError(null);
    }
  }, [open, course]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload: CoursePayload = {
      name: form.name.trim(),
      tee: form.tee.trim(),
      holes: Number(form.holes) as 9 | 18,
      course_rating: Number(form.course_rating),
      slope_rating: Number(form.slope_rating),
      par: Number(form.par),
    };

    try {
      const endpoint = course ? `/api/courses/${course.id}` : "/api/courses";
      const method = course ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Failed to save course");
      }

      setOpen(false);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={course ? "secondary" : "default"}>{triggerLabel ?? (course ? "Edit" : "Add course")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edit course" : "Add course"}</DialogTitle>
          <DialogDescription>Courses are stored locally and reused by rounds.</DialogDescription>
        </DialogHeader>

        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={submit}>
          <div className="md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="tee">Tee</Label>
            <Input
              id="tee"
              value={form.tee}
              onChange={(e) => setForm((prev) => ({ ...prev, tee: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="holes">Holes</Label>
            <Select
              id="holes"
              value={form.holes}
              onChange={(e) => setForm((prev) => ({ ...prev, holes: e.target.value }))}
            >
              <option value="9">9</option>
              <option value="18">18</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="course_rating">Course Rating</Label>
            <Input
              id="course_rating"
              type="number"
              step="0.1"
              value={form.course_rating}
              onChange={(e) => setForm((prev) => ({ ...prev, course_rating: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="slope_rating">Slope Rating</Label>
            <Input
              id="slope_rating"
              type="number"
              value={form.slope_rating}
              onChange={(e) => setForm((prev) => ({ ...prev, slope_rating: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="par">Par</Label>
            <Input
              id="par"
              type="number"
              value={form.par}
              onChange={(e) => setForm((prev) => ({ ...prev, par: e.target.value }))}
              required
            />
          </div>

          {error ? <Alert className="md:col-span-2 border-red-300 bg-red-50 text-red-900">{error}</Alert> : null}

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
