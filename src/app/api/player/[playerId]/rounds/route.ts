import { NextRequest } from "next/server";

import { err, ok, toApiError } from "@/lib/api";
import { createRound, listRoundsByPlayer } from "@/lib/repos/roundsRepo";
import { getClientIp, isRateLimited } from "@/lib/rateLimit/tokenBucket";
import {
  parseOrError,
  playerIdSchema,
  roundSchema,
  roundsQuerySchema,
} from "@/lib/validation/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  try {
    const { playerId } = await params;
    const parsedPlayer = parseOrError(playerIdSchema, playerId);
    if (!parsedPlayer.success) {
      return err(400, "Invalid playerId");
    }

    const queryParsed = parseOrError(roundsQuerySchema, {
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
      courseId: request.nextUrl.searchParams.get("courseId") ?? undefined,
    });

    if (!queryParsed.success) {
      return err(queryParsed.status, "Invalid query", queryParsed.error);
    }

    const rounds = await listRoundsByPlayer(parsedPlayer.data, {
      limit: queryParsed.data.limit,
      courseId: queryParsed.data.courseId,
    });

    return ok({ rounds });
  } catch (error) {
    return toApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(`rounds:create:${ip}`)) {
      return err(429, "Rate limit exceeded. Try again soon.");
    }

    const { playerId } = await params;
    const parsedPlayer = parseOrError(playerIdSchema, playerId);
    if (!parsedPlayer.success) {
      return err(400, "Invalid playerId");
    }

    const body = await request.json();
    const parsed = parseOrError(roundSchema, body);
    if (!parsed.success) {
      return err(parsed.status, "Invalid round payload", parsed.error);
    }

    const round = await createRound({
      ...parsed.data,
      player_id: parsedPlayer.data,
      notes: parsed.data.notes?.trim() || null,
    });

    return ok({ round }, { status: 201 });
  } catch (error) {
    return toApiError(error);
  }
}
