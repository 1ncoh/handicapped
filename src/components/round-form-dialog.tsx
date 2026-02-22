"use client";

import { useEffect, useMemo, useState } from "react";

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
import type { Course, RoundWithCourse } from "@/lib/types";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

type RoundPayload = {
  played_at: string;
  course_id: string;
  holes: 9 | 18;
  score: number;
  putts: number | null;
  gir: number | null;
  fir: number | null;
  three_putts: number | null;
  pcc: number;
  notes: string | null;
};

function toPayload(form: Record<string, string>, defaultHoles: 9 | 18): RoundPayload {
  const parseNullableInt = (value: string) => {
    if (!value.trim()) return null;
    return Number(value);
  };

  return {
    played_at: form.played_at,
    course_id: form.course_id,
    holes: Number(form.holes || defaultHoles) as 9 | 18,
    score: Number(form.score),
    putts: parseNullableInt(form.putts),
    gir: parseNullableInt(form.gir),
    fir: parseNullableInt(form.fir),
    three_putts: parseNullableInt(form.three_putts),
    pcc: Number(form.pcc || 0),
    notes: form.notes?.trim() || null,
  };
}

export function RoundFormDialog({
  playerId,
  courses,
  onSaved,
  round,
  triggerLabel,
  triggerVariant = "default",
}: {
  playerId: string;
  courses: Course[];
  onSaved: () => Promise<void> | void;
  round?: RoundWithCourse;
  triggerLabel?: string;
  triggerVariant?: "default" | "secondary" | "ghost" | "destructive";
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialCourseId = round?.course_id ?? courses[0]?.id ?? "";
  const initialCourse = courses.find((c) => c.id === initialCourseId) ?? courses[0];

  const [form, setForm] = useState<Record<string, string>>({
    played_at: round?.played_at ?? todayDate(),
    course_id: initialCourseId,
    holes: String(round?.holes ?? initialCourse?.holes ?? 18),
    score: String(round?.score ?? ""),
    putts: round?.putts == null ? "" : String(round.putts),
    gir: round?.gir == null ? "" : String(round.gir),
    fir: round?.fir == null ? "" : String(round.fir),
    three_putts: round?.three_putts == null ? "" : String(round.three_putts),
    pcc: String(round?.pcc ?? 0),
    notes: round?.notes ?? "",
  });

  useEffect(() => {
    if (!open) {
      const resetCourseId = round?.course_id ?? courses[0]?.id ?? "";
      const resetCourse = courses.find((c) => c.id === resetCourseId) ?? courses[0];
      setForm({
        played_at: round?.played_at ?? todayDate(),
        course_id: resetCourseId,
        holes: String(round?.holes ?? resetCourse?.holes ?? 18),
        score: String(round?.score ?? ""),
        putts: round?.putts == null ? "" : String(round.putts),
        gir: round?.gir == null ? "" : String(round.gir),
        fir: round?.fir == null ? "" : String(round.fir),
        three_putts: round?.three_putts == null ? "" : String(round.three_putts),
        pcc: String(round?.pcc ?? 0),
        notes: round?.notes ?? "",
      });
      setError(null);
    }
  }, [open, round, courses]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.course_id),
    [courses, form.course_id],
  );

  const holesMismatch = selectedCourse && Number(form.holes) !== selectedCourse.holes;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const payload = toPayload(form, selectedCourse?.holes ?? 18);
      const endpoint = round ? `/api/rounds/${round.id}` : `/api/player/${playerId}/rounds`;
      const method = round ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Failed to save round");
      }

      setOpen(false);
      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel ?? (round ? "Edit" : "Add round")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{round ? "Edit round" : "Add round"}</DialogTitle>
          <DialogDescription>
            Enter score and optional stats. All writes go through server API validation.
          </DialogDescription>
        </DialogHeader>

        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-1">
            <Label htmlFor="played_at">Played date</Label>
            <Input
              id="played_at"
              type="date"
              value={form.played_at}
              onChange={(e) => setForm((prev) => ({ ...prev, played_at: e.target.value }))}
              required
            />
          </div>

          <div className="md:col-span-1">
            <Label htmlFor="course_id">Course</Label>
            <Select
              id="course_id"
              value={form.course_id}
              onChange={(e) => {
                const course = courses.find((c) => c.id === e.target.value);
                setForm((prev) => ({
                  ...prev,
                  course_id: e.target.value,
                  holes: String(course?.holes ?? prev.holes),
                }));
              }}
              required
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.tee})
                </option>
              ))}
            </Select>
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
            <Label htmlFor="score">Score</Label>
            <Input
              id="score"
              type="number"
              min={20}
              max={200}
              value={form.score}
              onChange={(e) => setForm((prev) => ({ ...prev, score: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="putts">Putts (optional)</Label>
            <Input
              id="putts"
              type="number"
              min={0}
              max={120}
              value={form.putts}
              onChange={(e) => setForm((prev) => ({ ...prev, putts: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="gir">GIR (optional)</Label>
            <Input
              id="gir"
              type="number"
              min={0}
              max={18}
              value={form.gir}
              onChange={(e) => setForm((prev) => ({ ...prev, gir: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="fir">FIR (optional)</Label>
            <Input
              id="fir"
              type="number"
              min={0}
              max={18}
              value={form.fir}
              onChange={(e) => setForm((prev) => ({ ...prev, fir: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="three_putts">3-putts (optional)</Label>
            <Input
              id="three_putts"
              type="number"
              min={0}
              max={18}
              value={form.three_putts}
              onChange={(e) => setForm((prev) => ({ ...prev, three_putts: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="pcc">PCC</Label>
            <Input
              id="pcc"
              type="number"
              min={-5}
              max={5}
              value={form.pcc}
              onChange={(e) => setForm((prev) => ({ ...prev, pcc: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full rounded-md border border-zinc-300 p-2 text-sm outline-none ring-lime-700 focus:ring-2"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {holesMismatch ? (
            <Alert className="md:col-span-2">
              Selected holes differ from the course default ({selectedCourse.holes}). You can still save.
            </Alert>
          ) : null}

          {error ? <Alert className="md:col-span-2 border-red-300 bg-red-50 text-red-900">{error}</Alert> : null}

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || courses.length === 0}>
              {busy ? "Saving..." : "Save round"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
