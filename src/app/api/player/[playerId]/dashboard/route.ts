import { err, ok, toApiError } from "@/lib/api";
import { computeCurrentHandicap, computeIndexSeries, computeRecentStats } from "@/lib/handicap";
import { getPlayer } from "@/lib/repos/playersRepo";
import { listRoundsByPlayer } from "@/lib/repos/roundsRepo";
import { parseOrError, playerIdSchema } from "@/lib/validation/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> },
) {
  try {
    const { playerId } = await params;
    const parsedPlayer = parseOrError(playerIdSchema, playerId);
    if (!parsedPlayer.success) {
      return err(400, "Invalid playerId");
    }

    const player = await getPlayer(parsedPlayer.data);
    if (!player) {
      return err(404, "Player not found");
    }

    const rounds = await listRoundsByPlayer(player.id);
    const current = computeCurrentHandicap(rounds);
    const indexSeries = computeIndexSeries(rounds);
    const recentStats = computeRecentStats(rounds);

    return ok({
      player,
      currentIndex: current.index,
      provisional: current.provisional,
      indexMessage: current.message,
      indexSeries,
      recentStats,
      roundsCount: rounds.length,
      effectiveCount: current.effective.length,
    });
  } catch (error) {
    return toApiError(error);
  }
}
