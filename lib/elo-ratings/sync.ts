import { fetchWorldEloRatings } from "@/lib/elo-ratings/fetch";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import type { ensureAdminAuth } from "@/lib/pocketbase/admin";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;

export async function syncEloRatings(pb: Pb): Promise<{ updated: number; missing: string[] }> {
  const ratings = await fetchWorldEloRatings();
  const teams = await pb.collection(COLLECTIONS.teams).getFullList();
  let updated = 0;
  const missing: string[] = [];

  for (const record of teams) {
    const team = mapTeamRecord(record);
    const elo = ratings[team.code];
    if (elo == null) {
      missing.push(team.code);
      continue;
    }

    if (team.elo === elo) continue;

    await pb.collection(COLLECTIONS.teams).update(record.id, {
      elo,
      lastUpdated: new Date().toISOString(),
    });
    updated++;
  }

  return { updated, missing };
}
