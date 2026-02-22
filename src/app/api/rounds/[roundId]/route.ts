import { NextRequest } from "next/server";

import { err, ok, toApiError } from "@/lib/api";
import { deleteRound, updateRound } from "@/lib/repos/roundsRepo";
import { getClientIp, isRateLimited } from "@/lib/rateLimit/tokenBucket";
import { parseOrError, roundSchema, uuidSchema } from "@/lib/validation/schemas";

function parseRoundId(roundId: string) {
  const parsed = parseOrError(uuidSchema, roundId);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(`rounds:update:${ip}`)) {
      return err(429, "Rate limit exceeded. Try again soon.");
    }

    const { roundId } = await params;
    const id = parseRoundId(roundId);
    if (!id) {
      return err(400, "Invalid roundId");
    }

    const body = await request.json();
    const parsed = parseOrError(roundSchema, body);
    if (!parsed.success) {
      return err(parsed.status, "Invalid round payload", parsed.error);
    }

    const round = await updateRound(id, {
      ...parsed.data,
      notes: parsed.data.notes?.trim() || null,
    });

    return ok({ round });
  } catch (error) {
    return toApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(`rounds:delete:${ip}`)) {
      return err(429, "Rate limit exceeded. Try again soon.");
    }

    const { roundId } = await params;
    const id = parseRoundId(roundId);
    if (!id) {
      return err(400, "Invalid roundId");
    }

    await deleteRound(id);
    return ok({ success: true });
  } catch (error) {
    return toApiError(error);
  }
}
