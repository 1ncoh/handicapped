export const PLAYER_IDS = ["randall", "jaden"] as const;
export type PlayerId = (typeof PLAYER_IDS)[number];

export type Player = {
  id: PlayerId;
  name: string;
  created_at: string;
};

export type Course = {
  id: string;
  name: string;
  tee: string;
  holes: 9 | 18;
  course_rating: number;
  slope_rating: number;
  par: number;
  created_at: string;
  updated_at: string;
};

export type Round = {
  id: string;
  player_id: PlayerId;
  played_at: string;
  course_id: string;
  holes: 9 | 18;
  score: number;
  putts: number | null;
  balls_lost: number | null;
  gir: number | null;
  fir: number | null;
  three_putts: number | null;
  pcc: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RoundWithCourse = Round & { course: Course };

export type EffectiveDifferential = {
  date: string;
  value: number;
  source: "18" | "9-converted";
  roundIds: string[];
};
