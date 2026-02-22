"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DifferentialLineChart } from "@/components/differential-line-chart";
import { IndexLineChart } from "@/components/index-line-chart";
import { RoundFormDialog } from "@/components/round-form-dialog";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCourses, fetchDashboard, fetchRounds } from "@/lib/apiClient";
import { formatNumber, formatPercent } from "@/lib/format";
import { buildEffectiveDifferentials } from "@/lib/handicap";
import { PLAYER_IDS, type Course, type PlayerId, type RoundWithCourse } from "@/lib/types";

export default function PlayerDashboardPage() {
  const params = useParams<{ playerId: string }>();
  const playerId = params.playerId;

  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<RoundWithCourse[]>([]);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof fetchDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"index" | "differential">("index");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardData, coursesData, roundsData] = await Promise.all([
        fetchDashboard(playerId),
        fetchCourses(),
        fetchRounds(playerId),
      ]);
      setDashboard(dashboardData);
      setCourses(coursesData.courses);
      setRounds(roundsData.rounds);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) {
      setError("Invalid player id");
      setLoading(false);
      return;
    }
    if (!PLAYER_IDS.includes(playerId as PlayerId)) {
      setError("Invalid player id");
      setLoading(false);
      return;
    }
    void load();
  }, [load, playerId]);

  const differentialSeries = useMemo(
    () => buildEffectiveDifferentials(rounds).map((entry) => ({ date: entry.date, differential: entry.value })),
    [rounds],
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-lime-800 underline">
            Back home
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">{dashboard?.player.name ?? "Player dashboard"}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/player/${playerId}/rounds`}>Manage rounds</Link>
          </Button>
          <RoundFormDialog playerId={playerId} courses={courses} onSaved={load} />
        </div>
      </div>

      {error ? <Alert className="border-red-300 bg-red-50 text-red-900">{error}</Alert> : null}

      {loading ? <p className="text-sm text-zinc-500">Loading dashboard...</p> : null}

      {dashboard && !loading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Current Handicap Index: {formatNumber(dashboard.currentIndex, 1)}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={chartMode === "index" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setChartMode("index")}
                >
                  Index
                </Button>
                <Button
                  type="button"
                  variant={chartMode === "differential" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setChartMode("differential")}
                >
                  Differential
                </Button>
                {dashboard.provisional ? <Badge>Provisional</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.indexMessage ? <Alert>{dashboard.indexMessage}</Alert> : null}
              <div className="mt-3">
                {chartMode === "index" ? (
                  <IndexLineChart data={dashboard.indexSeries} />
                ) : (
                  <DifferentialLineChart data={differentialSeries} />
                )}
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg score (10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(dashboard.recentStats.avgScore, 1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg putts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(dashboard.recentStats.avgPutts, 1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">GIR%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatPercent(dashboard.recentStats.girPct)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">FIR%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatPercent(dashboard.recentStats.firPct)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">3-putt rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatNumber(dashboard.recentStats.threePuttRate, 1)}</div>
              </CardContent>
            </Card>
          </section>
        </div>
      ) : null}
    </main>
  );
}
