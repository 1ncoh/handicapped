"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExportPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/export");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Failed to export data");

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `handicapped-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unexpected error");
    } finally {
      setBusy(false);
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
          <p className="mb-3 text-sm text-zinc-600">Download all courses and rounds as JSON.</p>
          {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
          <Button onClick={download} disabled={busy}>
            {busy ? "Preparing..." : "Download export"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
