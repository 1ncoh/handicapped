"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PlayerHomeCard } from "@/components/player-home-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCourses, fetchPlayers } from "@/lib/apiClient";
import type { Course, Player } from "@/lib/types";

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [playersData, coursesData] = await Promise.all([fetchPlayers(), fetchCourses()]);
      setPlayers(playersData.players);
      setCourses(coursesData.courses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">handicapped</h1>
          <p className="text-sm text-zinc-600">Track rounds, stats, and Handicap Index for Randall and Jaden.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/courses">Manage courses</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/export">Export JSON</Link>
        </Button>
      </header>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error loading app</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
            <Button className="mt-3" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {loading ? <p className="text-sm text-zinc-500">Loading dashboards...</p> : null}

      {!loading && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {players.map((player) => (
            <PlayerHomeCard
              key={player.id}
              playerId={player.id}
              playerName={player.name}
              courses={courses}
              onRoundSaved={load}
            />
          ))}
        </div>
      ) : null}
    </main>
  );
}
