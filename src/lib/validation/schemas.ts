import { z } from "zod";

import { PLAYER_IDS } from "@/lib/types";

export const playerIdSchema = z.enum(PLAYER_IDS);

export const uuidSchema = z.string().uuid();

export const courseSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  tee: z.string().min(1).max(80).trim(),
  holes: z.union([z.literal(9), z.literal(18)]),
  course_rating: z.number().min(20).max(90),
  slope_rating: z.number().int().min(55).max(155),
  par: z.number().int().min(27).max(90),
}).superRefine((data, ctx) => {
  if (data.holes === 9 && (data.course_rating < 20 || data.course_rating > 45)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "9-hole course rating must be between 20.0 and 45.0",
      path: ["course_rating"],
    });
  }

  if (data.holes === 18 && (data.course_rating < 40 || data.course_rating > 90)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "18-hole course rating must be between 40.0 and 90.0",
      path: ["course_rating"],
    });
  }
});

export const roundSchema = z
  .object({
    played_at: z.iso.date(),
    course_id: uuidSchema,
    holes: z.union([z.literal(9), z.literal(18)]),
    score: z.number().int().min(20).max(200),
    putts: z.number().int().min(0).max(120).nullable().optional(),
    balls_lost: z.number().int().min(0).max(30).nullable().optional(),
    gir: z.number().int().min(0).max(18).nullable().optional(),
    fir: z.number().int().min(0).max(18).nullable().optional(),
    three_putts: z.number().int().min(0).max(18).nullable().optional(),
    pcc: z.number().int().min(-5).max(5).default(0),
    notes: z.string().max(2000).trim().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.gir != null && data.gir > data.holes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GIR cannot exceed holes",
        path: ["gir"],
      });
    }
    if (data.fir != null && data.fir > data.holes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FIR cannot exceed holes",
        path: ["fir"],
      });
    }
    if (data.three_putts != null && data.three_putts > data.holes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "3-putts cannot exceed holes",
        path: ["three_putts"],
      });
    }
  });

export const roundsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  courseId: uuidSchema.optional(),
});

export function parseOrError<T>(schema: z.ZodType<T>, value: unknown):
  | { success: true; data: T }
  | { success: false; status: number; error: unknown } {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      status: 400,
      error: {
        message: "Validation failed",
        issues: parsed.error.issues,
      },
    };
  }
  return { success: true, data: parsed.data };
}
