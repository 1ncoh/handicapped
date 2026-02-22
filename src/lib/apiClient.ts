import type { Course, Player, RoundWithCourse } from "@/lib/types";

export type DashboardResponse = {
  player: Player;
  currentIndex: number | null;
  provisional: boolean;
  indexMessage: string | null;
  indexSeries: Array<{ date: string; index: number | null; provisional: boolean; effectiveCount: number }>;
  recentStats: {
    avgScore: number | null;
    avgPutts: number | null;
    girPct: number | null;
    firPct: number | null;
    threePuttRate: number | null;
  };
  roundsCount: number;
  effectiveCount: number;
};

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }
  return data as T;
}

export async function fetchPlayers() {
  const response = await fetch("/api/players", { cache: "no-store" });
  return readJson<{ players: Player[] }>(response);
}

export async function fetchCourses() {
  const response = await fetch("/api/courses", { cache: "no-store" });
  return readJson<{ courses: Course[] }>(response);
}

export async function fetchDashboard(playerId: string) {
  const response = await fetch(`/api/player/${playerId}/dashboard`, { cache: "no-store" });
  return readJson<DashboardResponse>(response);
}

export async function fetchRounds(playerId: string, params?: { limit?: number; courseId?: string }) {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.courseId) search.set("courseId", params.courseId);

  const response = await fetch(`/api/player/${playerId}/rounds?${search.toString()}`, {
    cache: "no-store",
  });
  return readJson<{ rounds: RoundWithCourse[] }>(response);
}
