import { listPlayers } from "@/lib/repos/playersRepo";
import { ok, toApiError } from "@/lib/api";

export async function GET() {
  try {
    const players = await listPlayers();
    return ok({ players });
  } catch (error) {
    return toApiError(error);
  }
}
