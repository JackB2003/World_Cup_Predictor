import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { syncFixtures } from "@/lib/api-football/sync";
import { leagueSeasonFromEnv, runScript } from "@/lib/scripts/run-script";

async function main() {
  const { leagueId, season } = leagueSeasonFromEnv();
  const pb = await ensureAdminAuth();

  console.log(`Importing API-Football fixtures (league=${leagueId}, season=${season})...`);
  const count = await syncFixtures(pb, leagueId, season);
  console.log(`Imported/updated ${count} fixtures.`);
}

runScript(main);
