"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RoundFormDialog } from "@/components/round-form-dialog";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCourses, fetchRounds } from "@/lib/apiClient";
import { readableDate } from "@/lib/format";
import { buildEffectiveDifferentials, getUsedRoundIdsForCurrentIndex } from "@/lib/handicap";
import { PLAYER_IDS, type Course, type PlayerId, type RoundWithCourse } from "@/lib/types";

type FilterMode = "all" | "last10" | "course";

export default function PlayerRoundsPage() {
  const params = useParams<{ playerId: string }>();
  const playerId = params.playerId;

  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<RoundWithCourse[]>([]);
  const [allRounds, setAllRounds] = useState<RoundWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterCourseId, setFilterCourseId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, roundsData] = await Promise.all([
        fetchCourses(),
        fetchRounds(playerId, {
          limit: filterMode === "last10" ? 10 : undefined,
          courseId: filterMode === "course" ? filterCourseId || undefined : undefined,
        }),
      ]);
      const allRoundsData = await fetchRounds(playerId);
      setCourses(coursesData.courses);
      setRounds(roundsData.rounds);
      setAllRounds(allRoundsData.rounds);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load rounds");
    } finally {
      setLoading(false);
    }
  }, [filterCourseId, filterMode, playerId]);

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

  async function deleteRound(roundId: string) {
    if (!window.confirm("Delete this round?")) return;

    const response = await fetch(`/api/rounds/${roundId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error?.message ?? "Failed to delete round");
      return;
    }

    await load();
  }

  const title = useMemo(() => {
    if (playerId === "randall") return "Randall rounds";
    if (playerId === "jaden") return "Jaden rounds";
    return "Rounds";
  }, [playerId]);

  const differentialByRoundId = useMemo(() => {
    const map = new Map<string, number>();
    const effective = buildEffectiveDifferentials(allRounds);
    for (const entry of effective) {
      const roundId = entry.roundIds[0];
      if (roundId) {
        map.set(roundId, entry.value);
      }
    }
    return map;
  }, [allRounds]);

  const usedRoundIds = useMemo(() => getUsedRoundIdsForCurrentIndex(allRounds), [allRounds]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/player/${playerId}`} className="text-sm text-lime-800 underline">
            Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        <RoundFormDialog playerId={playerId} courses={courses} onSaved={load} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rounds</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={filterMode} onChange={(e) => setFilterMode(e.target.value as FilterMode)}>
              <option value="all">All</option>
              <option value="last10">Last 10</option>
              <option value="course">By course</option>
            </Select>
            {filterMode === "course" ? (
              <Select value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}>
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {error ? <Alert className="mb-3 border-red-300 bg-red-50 text-red-900">{error}</Alert> : null}
          {loading ? <p className="text-sm text-zinc-500">Loading rounds...</p> : null}

          {!loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Holes</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Differential</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Putts</TableHead>
                  <TableHead>Balls lost</TableHead>
                  <TableHead>GIR</TableHead>
                  <TableHead>FIR</TableHead>
                  <TableHead>3-putts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell>{readableDate(round.played_at)}</TableCell>
                    <TableCell>{round.course.name}</TableCell>
                    <TableCell>{round.holes}</TableCell>
                    <TableCell>{round.score}</TableCell>
                    <TableCell>
                      {differentialByRoundId.has(round.id)
                        ? differentialByRoundId.get(round.id)?.toFixed(1)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {usedRoundIds.has(round.id) ? <Badge className="bg-blue-100 text-blue-800">Yes</Badge> : "-"}
                    </TableCell>
                    <TableCell>{round.putts ?? "-"}</TableCell>
                    <TableCell>{round.balls_lost ?? "-"}</TableCell>
                    <TableCell>{round.gir ?? "-"}</TableCell>
                    <TableCell>{round.fir ?? "-"}</TableCell>
                    <TableCell>{round.three_putts ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <RoundFormDialog
                          playerId={playerId}
                          courses={courses}
                          onSaved={load}
                          round={round}
                          triggerLabel="Edit"
                          triggerVariant="secondary"
                        />
                        <Button variant="destructive" size="sm" onClick={() => deleteRound(round.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          {!loading && rounds.length === 0 ? <p className="text-sm text-zinc-500">No rounds found.</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
