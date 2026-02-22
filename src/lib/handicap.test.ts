import { describe, expect, it } from "vitest";

import {
  buildEffectiveDifferentials,
  computeHandicapIndexFromEffective,
  computeIndexSeries,
  truncateOneDecimal,
} from "@/lib/handicap";
import type { RoundWithCourse } from "@/lib/types";

function makeRound(partial: Partial<RoundWithCourse>): RoundWithCourse {
  return {
    id: partial.id ?? crypto.randomUUID(),
    player_id: "randall",
    played_at: partial.played_at ?? "2026-01-01",
    course_id: "course-1",
    holes: partial.holes ?? 18,
    score: partial.score ?? 90,
    putts: null,
    gir: null,
    fir: null,
    three_putts: null,
    pcc: partial.pcc ?? 0,
    notes: null,
    created_at: partial.created_at ?? `${partial.played_at ?? "2026-01-01"}T00:00:00.000Z`,
    updated_at: partial.updated_at ?? `${partial.played_at ?? "2026-01-01"}T00:00:00.000Z`,
    course: {
      id: "course-1",
      name: "Test Course",
      tee: "Blue",
      holes: 18,
      course_rating: partial.course?.course_rating ?? 72,
      slope_rating: partial.course?.slope_rating ?? 120,
      par: 72,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  };
}

describe("handicap", () => {
  it("truncates to one decimal", () => {
    expect(truncateOneDecimal(12.39)).toBe(12.3);
    expect(truncateOneDecimal(12.31)).toBe(12.3);
  });

  it("keeps each 9-hole round as its own converted effective differential", () => {
    const rounds = [
      makeRound({ id: "a", holes: 9, score: 43, played_at: "2026-01-01" }),
      makeRound({ id: "b", holes: 9, score: 45, played_at: "2026-01-02" }),
      makeRound({ id: "c", holes: 9, score: 44, played_at: "2026-01-03" }),
    ];

    const effective = buildEffectiveDifferentials(rounds);
    expect(effective).toHaveLength(3);
    expect(effective[0].source).toBe("9-converted");
    expect(effective[0].roundIds).toEqual(["a"]);
  });

  it("converts 9-hole differential to expected 18-hole equivalent", () => {
    const rounds = [
      makeRound({
        id: "a",
        holes: 9,
        score: 45,
        played_at: "2026-01-01",
        course: { course_rating: 72, slope_rating: 120, par: 72 } as RoundWithCourse["course"],
      }),
      makeRound({
        id: "b",
        holes: 9,
        score: 47,
        played_at: "2026-01-02",
        course: { course_rating: 72, slope_rating: 120, par: 72 } as RoundWithCourse["course"],
      }),
    ];

    const effective = buildEffectiveDifferentials(rounds);
    expect(effective).toHaveLength(2);
    expect(effective[0].value).toBeCloseTo(9.67, 2);
    expect(effective[1].value).toBeCloseTo(16.16, 2);
  });

  it("uses best 8 of last 20 effective differentials", () => {
    const effective = Array.from({ length: 25 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      value: i + 1,
      source: "18" as const,
      roundIds: [String(i)],
    }));

    const result = computeHandicapIndexFromEffective(effective);
    expect(result.index).toBe(9.1);
  });

  it("builds index series over time", () => {
    const rounds = [
      makeRound({ score: 92, played_at: "2026-01-01" }),
      makeRound({ score: 90, played_at: "2026-01-04" }),
      makeRound({ score: 88, played_at: "2026-01-07" }),
      makeRound({ score: 87, played_at: "2026-01-10" }),
    ];

    const series = computeIndexSeries(rounds);
    expect(series).toHaveLength(4);
    expect(series[0].index).not.toBeNull();
    expect(series[3].effectiveCount).toBe(4);
  });
});
