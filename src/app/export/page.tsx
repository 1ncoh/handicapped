"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExportData = {
  exportedAt: string;
  courses: { id: string; name: string; tee: string; holes: number }[];
  rounds: {
    player_id: string;
    played_at: string;
    course_id: string;
    holes: number;
    score: number;
    putts: number | null;
    balls_lost: number | null;
    gir: number | null;
    fir: number | null;
    three_putts: number | null;
    pcc: number;
    notes: string | null;
  }[];
};

function escapeCell(value: string | number | null | undefined) {
  const str = value == null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(data: ExportData): string {
  const courseMap = new Map(data.courses.map((c) => [c.id, c]));

  const headers = [
    "Date", "Player", "Course", "Tee", "Holes",
    "Score", "Putts", "Balls Lost", "GIR", "FIR", "3-putts", "PCC", "Notes",
  ];

  const rows = data.rounds.map((r) => {
    const course = courseMap.get(r.course_id);
    return [
      r.played_at, r.player_id,
      course?.name, course?.tee, r.holes,
      r.score, r.putts, r.balls_lost, r.gir, r.fir, r.three_putts, r.pcc, r.notes,
    ].map(escapeCell).join(",");
  });

  return [headers.map(escapeCell).join(","), ...rows].join("\n");
}

export default function ExportPage() {
  const [busy, setBusy] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(): Promise<ExportData> {
    const response = await fetch("/api/export");
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? "Failed to export data");
    return data as ExportData;
  }

  function triggerDownload(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadJson() {
    setBusy("json");
    setError(null);
    try {
      const data = await fetchData();
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(data, null, 2), `handicapped-export-${date}.json`, "application/json");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setBusy(null);
    }
  }

  async function downloadCsv() {
    setBusy("csv");
    setError(null);
    try {
      const data = await fetchData();
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(toCsv(data), `handicapped-rounds-${date}.csv`, "text/csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-lime-800 underline">
        Back home
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Export backup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-zinc-600">
            Download all courses and rounds. JSON includes full course detail; CSV is rounds only with course name and tee inlined.
          </p>
          {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
          <div className="flex gap-3">
            <Button onClick={downloadJson} disabled={busy !== null}>
              {busy === "json" ? "Preparing..." : "Download JSON"}
            </Button>
            <Button variant="secondary" onClick={downloadCsv} disabled={busy !== null}>
              {busy === "csv" ? "Preparing..." : "Download CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
