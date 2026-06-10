import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { apiFootball } from "@/lib/api-football/client";

async function main() {
  const leagueId = process.env.WORLD_CUP_LEAGUE_ID ?? "1";
  const season = process.env.WORLD_CUP_SEASON ?? "2026";
  const pb = await ensureAdminAuth();

  console.log(`Importing API-Football data (league=${leagueId}, season=${season})...`);

  const fixturesRes = await apiFootball.fixtures({ league: leagueId, season }) as {
    response?: Array<{
      fixture: { id: number; date: string; status: { short: string } };
      league: { round: string };
      teams: { home: { id: number; name: string }; away: { id: number; name: string } };
      goals: { home: number | null; away: number | null };
      venue: { name: string; city: string };
    }>;
  };

  let count = 0;
  for (const item of fixturesRes.response ?? []) {
    const matchId = `af-${item.fixture.id}`;
    const existing = await pb.collection(COLLECTIONS.matches).getFullList({
      filter: `matchId = "${matchId}"`,
    });

    const payload = {
      matchId,
      kickoffAt: item.fixture.date,
      time: new Date(item.fixture.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      venue: `${item.venue?.name ?? ""} · ${item.venue?.city ?? ""}`.trim(),
      stage: item.league.round,
      homeCode: item.teams.home.name.slice(0, 3).toUpperCase(),
      awayCode: item.teams.away.name.slice(0, 3).toUpperCase(),
      status: item.fixture.status.short,
      scoreHome: item.goals.home ?? 0,
      scoreAway: item.goals.away ?? 0,
      apiFixtureId: item.fixture.id,
      lastUpdated: new Date().toISOString(),
    };

    if (existing[0]) {
      await pb.collection(COLLECTIONS.matches).update(existing[0].id, payload);
    } else {
      await pb.collection(COLLECTIONS.matches).create(payload);
    }
    count++;
  }

  console.log(`Imported/updated ${count} fixtures.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
