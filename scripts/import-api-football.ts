import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { syncFixtures } from "@/lib/api-football/sync";

async function main() {
  const leagueId = process.env.WORLD_CUP_LEAGUE_ID ?? "1";
  const season = process.env.WORLD_CUP_SEASON ?? "2026";
  const pb = await ensureAdminAuth();

  console.log(`Importing API-Football fixtures (league=${leagueId}, season=${season})...`);
  const count = await syncFixtures(pb, leagueId, season);
  console.log(`Imported/updated ${count} fixtures.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
