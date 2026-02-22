"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricLineChart } from "@/components/metric-line-chart";
import { RoundFormDialog } from "@/components/round-form-dialog";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { fetchCourses, fetchDashboard, fetchRounds } from "@/lib/apiClient";
import { formatNumber, formatPercent } from "@/lib/format";
import { buildEffectiveDifferentials } from "@/lib/handicap";
import { PLAYER_IDS, type Course, type PlayerId, type RoundWithCourse } from "@/lib/types";

type ChartMetric =
  | "index"
  | "differential"
  | "score"
  | "putts"
  | "balls_lost"
  | "gir"
  | "fir"
  | "three_putts"
  | "pcc";

const CHART_OPTIONS: Array<{ value: ChartMetric; label: string; color: string }> = [
  { value: "index", label: "Handicap Index", color: "#3f6212" },
  { value: "differential", label: "Differential", color: "#1d4ed8" },
  { value: "score", label: "Score", color: "#b45309" },
  { value: "putts", label: "Putts", color: "#475569" },
  { value: "balls_lost", label: "Balls Lost", color: "#dc2626" },
  { value: "gir", label: "GIR", color: "#0f766e" },
  { value: "fir", label: "FIR", color: "#7c3aed" },
  { value: "three_putts", label: "3-putts", color: "#334155" },
  { value: "pcc", label: "PCC", color: "#0369a1" },
];

export default function PlayerDashboardPage() {
  const params = useParams<{ playerId: string }>();
  const playerId = params.playerId;

  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<RoundWithCourse[]>([]);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof fetchDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("index");

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

  const chartData = useMemo(() => {
    if (!dashboard) return [];
    if (chartMetric === "index") {
      return dashboard.indexSeries.map((entry) => ({ date: entry.date, value: entry.index }));
    }
    if (chartMetric === "differential") {
      return buildEffectiveDifferentials(rounds).map((entry) => ({ date: entry.date, value: entry.value }));
    }

    return [...rounds]
      .sort((a, b) => a.played_at.localeCompare(b.played_at))
      .map((round) => ({
        date: round.played_at,
        value: round[chartMetric] as number | null,
      }));
  }, [chartMetric, dashboard, rounds]);

  const selectedChartOption = CHART_OPTIONS.find((option) => option.value === chartMetric) ?? CHART_OPTIONS[0];

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
                <Select
                  value={chartMetric}
                  onChange={(event) => setChartMetric(event.target.value as ChartMetric)}
                  className="w-44"
                >
                  {CHART_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {dashboard.provisional ? <Badge>Provisional</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.indexMessage ? <Alert>{dashboard.indexMessage}</Alert> : null}
              <div className="mt-3">
                <MetricLineChart
                  data={chartData}
                  color={selectedChartOption.color}
                  emptyLabel={`No ${selectedChartOption.label.toLowerCase()} data yet.`}
                />
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
