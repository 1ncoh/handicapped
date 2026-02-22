import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function err(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        message,
        details,
      },
    },
    { status },
  );
}

export function toApiError(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return err(500, String((error as { message?: string }).message));
  }
  return err(500, "Unknown server error");
}
