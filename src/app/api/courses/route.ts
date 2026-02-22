import { NextRequest } from "next/server";

import { err, ok, toApiError } from "@/lib/api";
import { createCourse, listCourses } from "@/lib/repos/coursesRepo";
import { getClientIp, isRateLimited } from "@/lib/rateLimit/tokenBucket";
import { courseSchema, parseOrError } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const courses = await listCourses();
    return ok({ courses });
  } catch (error) {
    return toApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(`courses:create:${ip}`)) {
      return err(429, "Rate limit exceeded. Try again soon.");
    }

    const body = await request.json();
    const parsed = parseOrError(courseSchema, body);
    if (!parsed.success) {
      return err(parsed.status, "Invalid course payload", parsed.error);
    }

    const course = await createCourse(parsed.data);
    return ok({ course }, { status: 201 });
  } catch (error) {
    return toApiError(error);
  }
}
