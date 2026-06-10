/**
 * One-time head-to-head import: for each unique fixture pairing, fetches the last
 * 10 meetings from API-Football and stores the win/draw/loss tally in `h2h`.
 * Cached for the tournament — existing records are skipped.
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { apiFootball } from "@/lib/api-football/client";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import type { ApiFixtureItem, ApiListResponse } from "@/lib/api-football/types";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;
const FINISHED = new Set(["FT", "AET", "PEN"]);

async function ensureH2HCollection(pb: Pb): Promise<void> {
  try {
    await pb.collections.getOne(COLLECTIONS.h2h);
    return;
  } catch {
    // create below
  }
  await pb.collections.create({
    name: COLLECTIONS.h2h,
    type: "base",
    fields: [
      { name: "homeCode", type: "text", required: true },
      { name: "awayCode", type: "text", required: true },
      { name: "homeWins", type: "number" },
      { name: "draws", type: "number" },
      { name: "awayWins", type: "number" },
      { name: "total", type: "number" },
      { name: "fetchedAt", type: "date" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  console.log(`  + created ${COLLECTIONS.h2h} collection`);
}

async function main() {
  const pb = await ensureAdminAuth();
  await ensureH2HCollection(pb);

  const teams = (await pb.collection(COLLECTIONS.teams).getFullList()).map((r) => mapTeamRecord(r));
  const teamByCode = Object.fromEntries(teams.map((t) => [t.code, t]));

  const matches = await pb.collection(COLLECTIONS.matches).getFullList();
  const real = matches.filter((m) => m.apiFixtureId && m.apiFixtureId !== 0);

  // Unique ordered pairs keyed by the matchup as it appears in fixtures.
  const seen = new Set<string>();
  const pairs: { homeCode: string; awayCode: string }[] = [];
  for (const m of real) {
    const key = `${m.homeCode}|${m.awayCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ homeCode: m.homeCode, awayCode: m.awayCode });
  }

  console.log(`Importing H2H for ${pairs.length} fixture pairing(s)...`);
  let imported = 0;
  let skipped = 0;

  for (const { homeCode, awayCode } of pairs) {
    const home = teamByCode[homeCode];
    const away = teamByCode[awayCode];
    if (!home?.apiTeamId || !away?.apiTeamId) {
      skipped++;
      continue;
    }

    const existing = await pb.collection(COLLECTIONS.h2h).getFullList({
      filter: `homeCode = "${homeCode}" && awayCode = "${awayCode}"`,
    });
    if (existing[0]) {
      skipped++;
      continue;
    }

    try {
      const res = (await apiFootball.fixtures({
        h2h: `${home.apiTeamId}-${away.apiTeamId}`,
        last: 10,
      })) as ApiListResponse<ApiFixtureItem[]>;

      let homeWins = 0;
      let draws = 0;
      let awayWins = 0;
      for (const f of res.response ?? []) {
        if (!FINISHED.has(f.fixture.status.short)) continue;
        if (f.goals.home == null || f.goals.away == null) continue;
        // Map result back onto our home/away orientation by apiTeamId.
        const homeIsHome = f.teams.home.id === home.apiTeamId;
        const gFor = homeIsHome ? f.goals.home : f.goals.away;
        const gAgainst = homeIsHome ? f.goals.away : f.goals.home;
        if (gFor > gAgainst) homeWins++;
        else if (gFor < gAgainst) awayWins++;
        else draws++;
      }
      const total = homeWins + draws + awayWins;

      await pb.collection(COLLECTIONS.h2h).create({
        homeCode,
        awayCode,
        homeWins,
        draws,
        awayWins,
        total,
        fetchedAt: new Date().toISOString(),
      });
      imported++;
    } catch (e) {
      console.warn(`  H2H skipped for ${homeCode} vs ${awayCode}:`, e);
      skipped++;
    }
  }

  console.log(`Imported ${imported} H2H record(s), skipped ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
