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

// When 9 holes are played on an 18-hole course, halve the full course rating/par
// so the differential formula uses values that match the holes actually played.
// (If the course is already stored as a 9-hole course its rating/par are already correct.)
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

// The expected (average) 9-hole differential for a player at this handicap level.
// Formula: half the current index plus a constant offset (1.197) that accounts for
// the statistical relationship between 9-hole and 18-hole scoring variance.
function expectedNineDifferential(handicapAtTime: number) {
  return handicapAtTime / 2 + 1.197;
}

// Converts a round into an 18-hole-equivalent effective differential.
//
// For 18-hole rounds this is just the raw differential.
//
// For 9-hole rounds we do NOT wait to pair with a second 9-hole round.
// Instead, the raw 9-hole differential is combined with the expected 9-hole
// differential for the player's current handicap to produce a single effective
// value immediately. This lets each 9-hole round count on its own while still
// producing a number on the same scale as an 18-hole differential.
function toDifferential(round: RoundWithCourse, handicapAtTime: number) {
  const actual = computeRoundDifferential(round);
  if (round.holes === 9) {
    return actual + expectedNineDifferential(handicapAtTime);
  }

  return computeRoundDifferential(round);
}

// Processes rounds oldest-first, computing each round's effective differential
// using the handicap index that existed at that point in time. The running index
// is needed because 9-hole effective differentials depend on the current handicap
// (see toDifferential), so later rounds must see the index built from earlier ones.
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

export function getUsedRoundIdsForCurrentIndex(rounds: RoundWithCourse[]) {
  const effective = buildEffectiveDifferentials(rounds);
  const last20 = [...effective].slice(-20);
  const bestCount = Math.min(8, last20.length);
  const best = [...last20].sort((a, b) => a.value - b.value).slice(0, bestCount);

  const ids = new Set<string>();
  for (const entry of best) {
    for (const roundId of entry.roundIds) {
      ids.add(roundId);
    }
  }
  return ids;
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
