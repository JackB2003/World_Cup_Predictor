/**
 * Imports per-fixture statistics (xG, shots on target, possession) for finished
 * World Cup matches and rolls them up into per-team tournament averages stored
 * in `team_tournament_stats` for the live xG blend in the prediction model.
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { apiFootball } from "@/lib/api-football/client";
import { resolveTeamCode } from "@/lib/api-football/team-codes";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import type { ApiFixtureDetail, ApiListResponse } from "@/lib/api-football/types";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;

const FINISHED = new Set(["FT", "AET", "PEN"]);

type Accum = { xg: number; gf: number; ga: number; games: number };

async function ensureStatsCollection(pb: Pb): Promise<void> {
  try {
    await pb.collections.getOne(COLLECTIONS.teamTournamentStats);
    return;
  } catch {
    // create below
  }
  await pb.collections.create({
    name: COLLECTIONS.teamTournamentStats,
    type: "base",
    fields: [
      { name: "teamCode", type: "text", required: true },
      { name: "xgPerGame", type: "number" },
      { name: "gfPerGame", type: "number" },
      { name: "gaPerGame", type: "number" },
      { name: "gamesPlayed", type: "number" },
      { name: "lastUpdated", type: "date" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  console.log(`  + created ${COLLECTIONS.teamTournamentStats} collection`);
}

function statValue(stats: { type: string; value: string | number | null }[] | undefined, type: string): number {
  const entry = stats?.find((s) => s.type === type);
  if (!entry || entry.value == null) return 0;
  const raw = String(entry.value).replace("%", "").trim();
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : 0;
}

async function main() {
  const pb = await ensureAdminAuth();
  await ensureStatsCollection(pb);

  const refs = (await pb.collection(COLLECTIONS.teams).getFullList()).map((r) => mapTeamRecord(r));
  const matches = await pb.collection(COLLECTIONS.matches).getFullList();
  const finished = matches.filter(
    (m) => m.apiFixtureId && m.apiFixtureId !== 0 && FINISHED.has(m.status),
  );

  console.log(`Importing fixture statistics for ${finished.length} finished fixture(s)...`);

  const accum: Record<string, Accum> = {};
  const add = (code: string, xg: number, gf: number, ga: number) => {
    const a = (accum[code] ??= { xg: 0, gf: 0, ga: 0, games: 0 });
    a.xg += xg;
    a.gf += gf;
    a.ga += ga;
    a.games += 1;
  };

  for (const m of finished) {
    try {
      const res = (await apiFootball.fixtures({ id: m.apiFixtureId })) as ApiListResponse<ApiFixtureDetail[]>;
      const fx = res.response?.[0];
      if (!fx) continue;

      const homeCode = resolveTeamCode(fx.teams.home, refs) ?? m.homeCode;
      const awayCode = resolveTeamCode(fx.teams.away, refs) ?? m.awayCode;
      const gh = fx.goals.home ?? m.scoreHome ?? 0;
      const ga = fx.goals.away ?? m.scoreAway ?? 0;

      const homeStats = fx.statistics?.find((s) => s.team.id === fx.teams.home.id)?.statistics;
      const awayStats = fx.statistics?.find((s) => s.team.id === fx.teams.away.id)?.statistics;

      const homeXg = statValue(homeStats, "Expected Goals") || gh;
      const awayXg = statValue(awayStats, "Expected Goals") || ga;

      if (homeCode) add(homeCode, homeXg, gh, ga);
      if (awayCode) add(awayCode, awayXg, ga, gh);
    } catch (e) {
      console.warn(`  fixture stats skipped for ${m.apiFixtureId}:`, e);
    }
  }

  let written = 0;
  for (const [code, a] of Object.entries(accum)) {
    if (a.games <= 0) continue;
    const payload = {
      teamCode: code,
      xgPerGame: Math.round((a.xg / a.games) * 100) / 100,
      gfPerGame: Math.round((a.gf / a.games) * 100) / 100,
      gaPerGame: Math.round((a.ga / a.games) * 100) / 100,
      gamesPlayed: a.games,
      lastUpdated: new Date().toISOString(),
    };
    const existing = await pb.collection(COLLECTIONS.teamTournamentStats).getFullList({
      filter: `teamCode = "${code}"`,
    });
    if (existing[0]) {
      await pb.collection(COLLECTIONS.teamTournamentStats).update(existing[0].id, payload);
    } else {
      await pb.collection(COLLECTIONS.teamTournamentStats).create(payload);
    }
    written++;
  }

  console.log(`Updated tournament stats for ${written} team(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
