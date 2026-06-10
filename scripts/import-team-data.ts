import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import {
  syncFormFromFixtures,
  syncInjuriesToNews,
  syncStandings,
  syncTeamLinks,
  syncTeamStatisticsForToday,
  syncUpcomingMatchTeamCodes,
} from "@/lib/api-football/sync";

async function main() {
  const leagueId = process.env.WORLD_CUP_LEAGUE_ID ?? "1";
  const season = process.env.WORLD_CUP_SEASON ?? "2026";
  const pb = await ensureAdminAuth();

  console.log(`Syncing team data (league=${leagueId}, season=${season})...`);

  const links = await syncTeamLinks(pb, leagueId, season);
  console.log(`  Linked ${links} team(s) to API-Football IDs`);

  const standings = await syncStandings(pb, leagueId, season);
  console.log(`  Updated ${standings} standing row(s)`);

  const form = await syncFormFromFixtures(pb, leagueId, season);
  console.log(`  Refreshed form for ${form} team(s)`);

  const upcomingTeams = await syncUpcomingMatchTeamCodes(pb, 1);
  const stats = await syncTeamStatisticsForToday(pb, leagueId, season, upcomingTeams);
  console.log(`  Refreshed statistics for ${stats} team(s) with matches today/tomorrow`);

  const injuries = await syncInjuriesToNews(pb, leagueId, season);
  console.log(`  Imported ${injuries} injury/suspension alert(s) to news`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
