"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeComparisonChart } from "@/components/home-comparison-chart";
import { PlayerHomeCard } from "@/components/player-home-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCourses, fetchDashboard, fetchPlayers, type DashboardResponse } from "@/lib/apiClient";
import type { Course, Player, PlayerId } from "@/lib/types";

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboards, setDashboards] = useState<Record<string, DashboardResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const playersData = await fetchPlayers();
      const [coursesData, ...dashboardData] = await Promise.all([
        fetchCourses(),
        ...playersData.players.map((player) => fetchDashboard(player.id)),
      ]);

      const dashboardByPlayerId: Record<string, DashboardResponse> = {};
      for (const dashboard of dashboardData) {
        dashboardByPlayerId[dashboard.player.id] = dashboard;
      }

      setPlayers(playersData.players);
      setCourses(coursesData.courses);
      setDashboards(dashboardByPlayerId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const comparisonData = useMemo(() => {
    const byDate = new Map<string, { date: string; randall: number | null; jaden: number | null }>();

    const randallSeries = dashboards.randall?.indexSeries ?? [];
    const jadenSeries = dashboards.jaden?.indexSeries ?? [];

    for (const point of randallSeries) {
      const row = byDate.get(point.date) ?? { date: point.date, randall: null, jaden: null };
      row.randall = point.index;
      byDate.set(point.date, row);
    }

    for (const point of jadenSeries) {
      const row = byDate.get(point.date) ?? { date: point.date, randall: null, jaden: null };
      row.jaden = point.index;
      byDate.set(point.date, row);
    }

    const sorted = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    let lastRandall: number | null = null;
    let lastJaden: number | null = null;

    return sorted.map((row) => {
      if (row.randall != null) {
        lastRandall = row.randall;
      } else if (lastRandall != null) {
        row.randall = lastRandall;
      }

      if (row.jaden != null) {
        lastJaden = row.jaden;
      } else if (lastJaden != null) {
        row.jaden = lastJaden;
      }

      return row;
    });
  }, [dashboards]);

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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Handicap Index Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <HomeComparisonChart data={comparisonData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {players.map((player) => {
              const playerDashboard = dashboards[player.id as PlayerId];
              return (
                <PlayerHomeCard
                  key={player.id}
                  playerId={player.id as PlayerId}
                  playerName={player.name}
                  courses={courses}
                  onRoundSaved={load}
                  currentIndex={playerDashboard?.currentIndex ?? null}
                  provisional={playerDashboard?.provisional ?? false}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </main>
  );
}
