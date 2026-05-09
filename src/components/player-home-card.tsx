"use client";

import Link from "next/link";

import { RoundFormDialog } from "@/components/round-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/format";
import type { Course, PlayerId } from "@/lib/types";

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-sm font-semibold text-zinc-700">{value}</div>
    </div>
  );
}

export function PlayerHomeCard({
  playerId,
  playerName,
  courses,
  onRoundSaved,
  currentIndex,
  provisional,
  lowestIndex,
  avgPuttsPerHole,
  diffStdDev,
  underHandicapRate,
}: {
  playerId: PlayerId;
  playerName: string;
  courses: Course[];
  onRoundSaved: () => Promise<void> | void;
  currentIndex: number | null;
  provisional: boolean;
  lowestIndex: number | null;
  avgPuttsPerHole: number | null;
  diffStdDev: number | null;
  underHandicapRate: number | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex-1">
          <Link
            href={`/player/${playerId}`}
            className="text-base font-semibold text-zinc-700 transition-colors hover:text-zinc-900"
          >
            {playerName}
          </Link>
          <div className="mt-1.5 text-4xl font-bold tracking-tight text-zinc-900">
            {formatNumber(currentIndex, 1)}
          </div>
          <div className="mt-0.5 text-xs uppercase tracking-wide text-zinc-400">Handicap Index</div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
            <MiniStat label="Low index" value={formatNumber(lowestIndex, 1)} />
            <MiniStat label="Putts / hole" value={formatNumber(avgPuttsPerHole, 2)} />
            <MiniStat
              label="Consistency (±)"
              value={diffStdDev != null ? formatNumber(diffStdDev, 1) : "N/A"}
            />
            <MiniStat label="Under HCP" value={formatPercent(underHandicapRate)} />
          </div>
        </div>
        {provisional ? <Badge>Provisional</Badge> : null}
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex flex-wrap gap-2">
          <RoundFormDialog playerId={playerId} courses={courses} onSaved={onRoundSaved} />
          <Button asChild variant="secondary" size="sm">
            <Link href={`/player/${playerId}`}>Dashboard →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
