"use client";

import Link from "next/link";

import { RoundFormDialog } from "@/components/round-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { Course, PlayerId } from "@/lib/types";

export function PlayerHomeCard({
  playerId,
  playerName,
  courses,
  onRoundSaved,
  currentIndex,
  provisional,
}: {
  playerId: PlayerId;
  playerName: string;
  courses: Course[];
  onRoundSaved: () => Promise<void> | void;
  currentIndex: number | null;
  provisional: boolean;
}) {
  async function handleRoundSaved() {
    await onRoundSaved();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{playerName}</CardTitle>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{formatNumber(currentIndex, 1)}</div>
          <div className="text-xs text-zinc-500">Handicap Index</div>
        </div>
        {provisional ? <Badge>Provisional</Badge> : null}
      </CardHeader>
      <CardContent>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/player/${playerId}`}>View dashboard</Link>
          </Button>
          <RoundFormDialog playerId={playerId} courses={courses} onSaved={handleRoundSaved} triggerLabel="Add round" />
        </div>
      </CardContent>
    </Card>
  );
}
