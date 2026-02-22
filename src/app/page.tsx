"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HomeComparisonChart } from "@/components/home-comparison-chart";
import { PlayerHomeCard } from "@/components/player-home-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { fetchCourses, fetchDashboard, fetchPlayers, type DashboardResponse } from "@/lib/apiClient";
import { filterSeriesByTimeframe, type TimeframeOption } from "@/lib/timeframe";
import type { Course, Player, PlayerId } from "@/lib/types";

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboards, setDashboards] = useState<Record<string, DashboardResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1y");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

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

  const filteredComparisonData = useMemo(
    () => filterSeriesByTimeframe(comparisonData, timeframe, customStart || undefined, customEnd || undefined),
    [comparisonData, timeframe, customStart, customEnd],
  );

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Handicap Index Over Time</CardTitle>
              <Select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value as TimeframeOption)}
                className="w-36"
              >
                <option value="90d">90 days</option>
                <option value="6m">6 months</option>
                <option value="1y">1 year</option>
                <option value="all">All time</option>
                <option value="custom">Custom</option>
              </Select>
            </CardHeader>
            <CardContent>
              {timeframe === "custom" ? (
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>
                    <div className="mb-1 text-xs text-zinc-600">Start date</div>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                      className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-zinc-600">End date</div>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                      className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm"
                    />
                  </div>
                </div>
              ) : null}
              <HomeComparisonChart data={filteredComparisonData} />
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
