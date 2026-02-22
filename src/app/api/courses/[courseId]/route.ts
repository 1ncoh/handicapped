import { NextRequest } from "next/server";

import { err, ok, toApiError } from "@/lib/api";
import { deleteCourse, updateCourse } from "@/lib/repos/coursesRepo";
import { getClientIp, isRateLimited } from "@/lib/rateLimit/tokenBucket";
import { courseSchema, parseOrError, uuidSchema } from "@/lib/validation/schemas";

function parseCourseId(courseId: string) {
  const parsed = parseOrError(uuidSchema, courseId);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(`courses:update:${ip}`)) {
      return err(429, "Rate limit exceeded. Try again soon.");
    }

    const { courseId } = await params;
    const id = parseCourseId(courseId);
    if (!id) {
      return err(400, "Invalid courseId");
    }

    const body = await request.json();
    const parsed = parseOrError(courseSchema, body);
    if (!parsed.success) {
      return err(parsed.status, "Invalid course payload", parsed.error);
    }

    const course = await updateCourse(id, parsed.data);
    return ok({ course });
  } catch (error) {
    return toApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(`courses:delete:${ip}`)) {
      return err(429, "Rate limit exceeded. Try again soon.");
    }

    const { courseId } = await params;
    const id = parseCourseId(courseId);
    if (!id) {
      return err(400, "Invalid courseId");
    }

    await deleteCourse(id);
    return ok({ success: true });
  } catch (error) {
    return toApiError(error);
  }
}
