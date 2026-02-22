import type { EffectiveDifferential, RoundWithCourse } from "@/lib/types";

export function truncateOneDecimal(value: number) {
  return Math.trunc(value * 10) / 10;
}

export function computeDifferential(input: {
  slope: number;
  adjustedGrossScore: number;
  courseRating: number;
  pcc?: number;
}) {
  const pcc = input.pcc ?? 0;
  return (113 / input.slope) * (input.adjustedGrossScore - input.courseRating - pcc);
}

function ratingForPlayedHoles(round: RoundWithCourse) {
  if (round.holes === 9 && round.course.holes === 18) {
    return round.course.course_rating / 2;
  }
  return round.course.course_rating;
}

function parForPlayedHoles(round: RoundWithCourse) {
  if (round.holes === 9 && round.course.holes === 18) {
    return round.course.par / 2;
  }
  return round.course.par;
}

export function computeRoundDifferential(round: RoundWithCourse) {
  return computeDifferential({
    slope: round.course.slope_rating,
    adjustedGrossScore: round.score,
    courseRating: ratingForPlayedHoles(round),
    pcc: round.pcc,
  });
}

function expectedNineDifferential(handicapAtTime: number) {
  return handicapAtTime / 2 + 1.197;
}

function toDifferential(round: RoundWithCourse, handicapAtTime: number) {
  const actual = computeRoundDifferential(round);
  if (round.holes === 9) {
    return actual + expectedNineDifferential(handicapAtTime);
  }

  return computeRoundDifferential(round);
}

function evaluateRoundsChronological(rounds: RoundWithCourse[]) {
  const ordered = [...rounds].sort((a, b) => {
    const byDate = a.played_at.localeCompare(b.played_at);
    if (byDate !== 0) return byDate;
    return a.created_at.localeCompare(b.created_at);
  });

  const effective: EffectiveDifferential[] = [];
  const evaluated: Array<{ round: RoundWithCourse; handicapAtTime: number; effectiveValue: number }> = [];

  for (const round of ordered) {
    const handicapAtTime = computeHandicapIndexFromEffective(effective).index ?? 0;
    const effectiveValue = toDifferential(round, handicapAtTime);
    evaluated.push({ round, handicapAtTime, effectiveValue });
    effective.push({
      date: round.played_at,
      value: effectiveValue,
      source: round.holes === 9 ? "9-converted" : "18",
      roundIds: [round.id],
    });
  }

  return { effective, evaluated };
}

export function buildEffectiveDifferentials(rounds: RoundWithCourse[]): EffectiveDifferential[] {
  return evaluateRoundsChronological(rounds).effective;
}

export function computeHandicapIndexFromEffective(effective: EffectiveDifferential[]) {
  if (effective.length === 0) {
    return {
      index: null,
      provisional: false,
      message: "Not enough rounds yet",
      effectiveCount: 0,
    };
  }

  const last20 = [...effective].slice(-20);
  const bestCount = Math.min(8, last20.length);
  const best = [...last20]
    .sort((a, b) => a.value - b.value)
    .slice(0, bestCount)
    .map((x) => x.value);

  const avg = best.reduce((acc, v) => acc + v, 0) / best.length;
  const index = truncateOneDecimal(avg * 0.96);

  return {
    index,
    provisional: effective.length < 8,
    message: effective.length < 8 ? "Not enough rounds yet" : null,
    effectiveCount: effective.length,
  };
}

export function computeCurrentHandicap(rounds: RoundWithCourse[]) {
  const effective = buildEffectiveDifferentials(rounds);
  return {
    ...computeHandicapIndexFromEffective(effective),
    effective,
  };
}

export function computeIndexSeries(rounds: RoundWithCourse[]) {
  const effective = buildEffectiveDifferentials(rounds);
  const series: Array<{
    date: string;
    index: number | null;
    provisional: boolean;
    effectiveCount: number;
  }> = [];

  for (let i = 0; i < effective.length; i += 1) {
    const upTo = effective.slice(0, i + 1);
    const current = computeHandicapIndexFromEffective(upTo);
    series.push({
      date: effective[i].date,
      index: current.index,
      provisional: current.provisional,
      effectiveCount: current.effectiveCount,
    });
  }

  return series;
}

export function computeRecentStats(rounds: RoundWithCourse[]) {
  const evaluated = evaluateRoundsChronological(rounds).evaluated;
  const adjustedScoreByRoundId = new Map<string, number>();
  for (const item of evaluated) {
    const adjustedScore =
      item.round.holes === 9
        ? item.round.score + parForPlayedHoles(item.round) + expectedNineDifferential(item.handicapAtTime)
        : item.round.score;
    adjustedScoreByRoundId.set(item.round.id, adjustedScore);
  }

  const recent = [...rounds]
    .sort((a, b) => b.played_at.localeCompare(a.played_at))
    .slice(0, 10);

  const avgScore = recent.length
    ? recent.reduce((sum, r) => sum + (adjustedScoreByRoundId.get(r.id) ?? r.score), 0) / recent.length
    : null;

  const withPutts = recent.filter((r) => r.putts != null);
  const avgPutts = withPutts.length
    ? withPutts.reduce((sum, r) => sum + (r.putts ?? 0), 0) / withPutts.length
    : null;

  const withGir = recent.filter((r) => r.gir != null);
  const girPct = withGir.length
    ? (withGir.reduce((sum, r) => sum + (r.gir ?? 0), 0) /
        withGir.reduce((sum, r) => sum + r.holes, 0)) *
      100
    : null;

  const withFir = recent.filter((r) => r.fir != null);
  const firPct = withFir.length
    ? (withFir.reduce((sum, r) => sum + (r.fir ?? 0), 0) /
        withFir.reduce((sum, r) => sum + r.holes, 0)) *
      100
    : null;

  const withThreePutts = recent.filter((r) => r.three_putts != null);
  const threePuttRate = withThreePutts.length
    ? withThreePutts.reduce((sum, r) => sum + (r.three_putts ?? 0), 0) /
      withThreePutts.length
    : null;

  return {
    avgScore,
    avgPutts,
    girPct,
    firPct,
    threePuttRate,
  };
}
