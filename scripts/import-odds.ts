/**
 * Imports Bet365 (fallback Unibet) match-winner odds for upcoming fixtures,
 * converts decimal odds to vig-free implied probabilities, and stores them in
 * the `match_odds` collection for the prediction engine to blend with.
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { apiFootball } from "@/lib/api-football/client";
import type { ApiListResponse, ApiOddsItem } from "@/lib/api-football/types";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;

const FINISHED = new Set(["FT", "AET", "PEN"]);
const BET365 = 8;
const UNIBET = 1;

async function ensureMatchOddsCollection(pb: Pb): Promise<void> {
  try {
    await pb.collections.getOne(COLLECTIONS.matchOdds);
    return;
  } catch {
    // create below
  }
  await pb.collections.create({
    name: COLLECTIONS.matchOdds,
    type: "base",
    fields: [
      { name: "fixtureId", type: "text", required: true },
      { name: "matchId", type: "text" },
      { name: "oddsHome", type: "number" },
      { name: "oddsDraw", type: "number" },
      { name: "oddsAway", type: "number" },
      { name: "fetchedAt", type: "date" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  console.log(`  + created ${COLLECTIONS.matchOdds} collection`);
}

function extractMatchWinner(item: ApiOddsItem | undefined, bookmakerId: number) {
  const bookmaker = item?.bookmakers?.find((b) => b.id === bookmakerId) ?? item?.bookmakers?.[0];
  const bet = bookmaker?.bets?.find((x) => x.name === "Match Winner");
  if (!bet) return null;

  const find = (value: string) => bet.values.find((v) => v.value === value);
  const home = find("Home");
  const draw = find("Draw");
  const away = find("Away");
  if (!home || !draw || !away) return null;

  const oddH = parseFloat(home.odd);
  const oddD = parseFloat(draw.odd);
  const oddA = parseFloat(away.odd);
  if (!(oddH > 0) || !(oddD > 0) || !(oddA > 0)) return null;

  // Decimal odds → implied probability, then normalize out the bookmaker vig.
  const rawH = 1 / oddH;
  const rawD = 1 / oddD;
  const rawA = 1 / oddA;
  const sum = rawH + rawD + rawA;
  return {
    oddsHome: Math.round((rawH / sum) * 1000) / 1000,
    oddsDraw: Math.round((rawD / sum) * 1000) / 1000,
    oddsAway: Math.round((rawA / sum) * 1000) / 1000,
  };
}

async function fetchOdds(fixtureId: number) {
  for (const bookmaker of [BET365, UNIBET]) {
    try {
      const res = (await apiFootball.odds({ fixture: fixtureId, bookmaker })) as ApiListResponse<ApiOddsItem[]>;
      const probs = extractMatchWinner(res.response?.[0], bookmaker);
      if (probs) return probs;
    } catch (e) {
      console.warn(`  odds fetch failed for fixture ${fixtureId} (bookmaker ${bookmaker}):`, e);
    }
  }
  return null;
}

async function main() {
  const pb = await ensureAdminAuth();
  await ensureMatchOddsCollection(pb);

  const matches = await pb.collection(COLLECTIONS.matches).getFullList();
  const upcoming = matches.filter(
    (m) => m.apiFixtureId && m.apiFixtureId !== 0 && !FINISHED.has(m.status),
  );

  console.log(`Importing odds for ${upcoming.length} upcoming fixture(s)...`);
  let imported = 0;

  for (const m of upcoming) {
    const probs = await fetchOdds(m.apiFixtureId);
    if (!probs) continue;

    const payload = {
      fixtureId: String(m.apiFixtureId),
      matchId: m.matchId,
      ...probs,
      fetchedAt: new Date().toISOString(),
    };

    const existing = await pb.collection(COLLECTIONS.matchOdds).getFullList({
      filter: `fixtureId = "${m.apiFixtureId}"`,
    });
    if (existing[0]) {
      await pb.collection(COLLECTIONS.matchOdds).update(existing[0].id, payload);
    } else {
      await pb.collection(COLLECTIONS.matchOdds).create(payload);
    }
    imported++;
  }

  console.log(`Imported ${imported} odds record(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
