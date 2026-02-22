"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CourseSeed } from "@/components/course-form-dialog";

type SearchResult = {
  id: string;
  name: string;
  location?: string;
  tee?: string;
  details?: CourseSeed | null;
};

export function CourseSearchPanel({ onPick }: { onPick: (seed: CourseSeed) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/course-search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Search failed");
      setResults(data.results ?? []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search courses (mock provider)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: Pebble, Canyon, Lakeside"
          />
          <Button type="button" onClick={search} disabled={busy || query.trim().length < 2}>
            {busy ? "Searching..." : "Search"}
          </Button>
        </div>

        {error ? <div className="text-sm text-red-700">{error}</div> : null}

        <div className="space-y-2">
          {results.map((result) => (
            <div key={result.id} className="flex items-center justify-between rounded-md border border-zinc-200 p-2">
              <div>
                <div className="font-medium">{result.name}</div>
                <div className="text-xs text-zinc-500">
                  {result.tee} {result.location ? `- ${result.location}` : ""}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!result.details}
                onClick={() => result.details && onPick(result.details)}
              >
                Use details
              </Button>
            </div>
          ))}

          {!busy && results.length === 0 ? (
            <div className="text-sm text-zinc-500">No results yet. Run a search.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
