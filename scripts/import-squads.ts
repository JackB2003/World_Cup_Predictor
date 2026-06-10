/**
 * One-time squad import: fetches each team's squad from API-Football and stores
 * squad size, outfield-player count, and a simple depth score in `team_squads`.
 * Gives the injury model a denominator (available outfield players).
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { apiFootball } from "@/lib/api-football/client";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import type { ApiListResponse, ApiSquadItem } from "@/lib/api-football/types";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;

async function ensureSquadCollection(pb: Pb): Promise<void> {
  try {
    await pb.collections.getOne(COLLECTIONS.teamSquads);
    return;
  } catch {
    // create below
  }
  await pb.collections.create({
    name: COLLECTIONS.teamSquads,
    type: "base",
    fields: [
      { name: "teamCode", type: "text", required: true },
      { name: "squadSize", type: "number" },
      { name: "outfieldPlayers", type: "number" },
      { name: "depthScore", type: "number" },
      { name: "fetchedAt", type: "date" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  console.log(`  + created ${COLLECTIONS.teamSquads} collection`);
}

async function main() {
  const pb = await ensureAdminAuth();
  await ensureSquadCollection(pb);

  const teams = (await pb.collection(COLLECTIONS.teams).getFullList())
    .map((r) => mapTeamRecord(r))
    .filter((t) => t.apiTeamId);

  console.log(`Importing squads for ${teams.length} team(s)...`);
  let imported = 0;

  for (const t of teams) {
    try {
      const res = (await apiFootball.squads({ team: t.apiTeamId as number })) as ApiListResponse<ApiSquadItem[]>;
      const players = res.response?.[0]?.players ?? [];
      if (!players.length) continue;

      const squadSize = players.length;
      const outfieldPlayers = players.filter(
        (p) => (p.position ?? "").toLowerCase() !== "goalkeeper",
      ).length;
      // Depth score: outfield availability relative to a healthy 20-player baseline.
      const depthScore = Math.round(Math.min(1, outfieldPlayers / 20) * 100) / 100;

      const payload = {
        teamCode: t.code,
        squadSize,
        outfieldPlayers,
        depthScore,
        fetchedAt: new Date().toISOString(),
      };

      const existing = await pb.collection(COLLECTIONS.teamSquads).getFullList({
        filter: `teamCode = "${t.code}"`,
      });
      if (existing[0]) {
        await pb.collection(COLLECTIONS.teamSquads).update(existing[0].id, payload);
      } else {
        await pb.collection(COLLECTIONS.teamSquads).create(payload);
      }
      imported++;
    } catch (e) {
      console.warn(`  squad skipped for ${t.code}:`, e);
    }
  }

  console.log(`Imported ${imported} squad record(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
