import { NextRequest } from "next/server";
import { z } from "zod";

import { err, ok, toApiError } from "@/lib/api";
import { mockCourseProvider } from "@/lib/courseProviders/mockProvider";

const searchQuerySchema = z.object({
  query: z.string().min(2).max(80),
});

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query") ?? "";
    const parsed = searchQuerySchema.safeParse({ query });

    if (!parsed.success) {
      return err(400, "Query must be 2-80 chars");
    }

    const baseResults = await mockCourseProvider.searchCourses(parsed.data.query);
    const results = await Promise.all(
      baseResults.map(async (result) => ({
        ...result,
        details: await mockCourseProvider.getCourseDetails(result.id),
      })),
    );
    return ok({ results });
  } catch (error) {
    return toApiError(error);
  }
}
