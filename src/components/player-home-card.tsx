"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { IndexLineChart } from "@/components/index-line-chart";
import { RoundFormDialog } from "@/components/round-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboard } from "@/lib/apiClient";
import { formatNumber } from "@/lib/format";
import type { Course, PlayerId } from "@/lib/types";

type DashboardData = {
  currentIndex: number | null;
  provisional: boolean;
  indexSeries: Array<{ date: string; index: number | null }>;
};

export function PlayerHomeCard({
  playerId,
  playerName,
  courses,
  onRoundSaved,
}: {
  playerId: PlayerId;
  playerName: string;
  courses: Course[];
  onRoundSaved: () => Promise<void> | void;
}) {
  const [state, setState] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDashboard(playerId);
      setState({
        currentIndex: data.currentIndex,
        provisional: data.provisional,
        indexSeries: data.indexSeries,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRoundSaved() {
    await onRoundSaved();
    await load();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{playerName}</CardTitle>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : formatNumber(state?.currentIndex ?? null, 1)}
          </div>
          <div className="text-xs text-zinc-500">Handicap Index</div>
        </div>
        {state?.provisional ? <Badge>Provisional</Badge> : null}
      </CardHeader>
      <CardContent>
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
        {!error ? <IndexLineChart data={state?.indexSeries ?? []} tiny /> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/player/${playerId}`}>View dashboard</Link>
          </Button>
          <RoundFormDialog playerId={playerId} courses={courses} onSaved={handleRoundSaved} triggerLabel="Add round" />
        </div>
      </CardContent>
    </Card>
  );
}
