import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Player, PlayerId } from "@/lib/types";

export async function listPlayers(): Promise<Player[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function getPlayer(playerId: PlayerId): Promise<Player | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .maybeSingle();

  if (error) throw error;
  return (data as Player | null) ?? null;
}
