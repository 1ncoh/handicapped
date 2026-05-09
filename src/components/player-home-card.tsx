"use client";

import Link from "next/link";

import { RoundFormDialog } from "@/components/round-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { Course, PlayerId } from "@/lib/types";

export function PlayerHomeCard({
  playerId,
  playerName,
  courses,
  onRoundSaved,
  currentIndex,
  provisional,
  lowestIndex,
  avgPuttsPerHole,
}: {
  playerId: PlayerId;
  playerName: string;
  courses: Course[];
  onRoundSaved: () => Promise<void> | void;
  currentIndex: number | null;
  provisional: boolean;
  lowestIndex: number | null;
  avgPuttsPerHole: number | null;
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

          <div className="mt-3 flex gap-5">
            <div>
              <div className="text-xs text-zinc-400">Low index</div>
              <div className="text-sm font-semibold text-zinc-700">{formatNumber(lowestIndex, 1)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Putts / hole</div>
              <div className="text-sm font-semibold text-zinc-700">{formatNumber(avgPuttsPerHole, 2)}</div>
            </div>
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
