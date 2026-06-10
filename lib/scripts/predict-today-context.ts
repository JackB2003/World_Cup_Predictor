import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import { selectUpcomingWindow } from "@/lib/data/match-window";
import { mapNewsFromPb } from "@/lib/data/world-cup-mappers";
import { SEED_DATA } from "@/lib/data/seed";
import type { MatchContext, MatchPrediction } from "@/features/predictions/match-engine";
import { enhancePredictionReasoning } from "@/lib/openai/reasoning";
import type { Team, NewsItem } from "@/types/world-cup";
import type { TournamentStats } from "@/features/predictions/score-model";

const FINISHED = new Set(["FT", "AET", "PEN"]);

type PbRecord = Record<string, unknown>;

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Days between a team's most recent finished match (before today) and now. */
function restDaysFor(teamCode: string, allMatches: PbRecord[], reference: Date): number | undefined {
  const played = allMatches
    .filter((m) => {
      const status = m.status as string | undefined;
      const ko = m.kickoffAt as string | undefined;
      if (!ko || !status || !FINISHED.has(status)) return false;
      if (m.homeCode !== teamCode && m.awayCode !== teamCode) return false;
      return new Date(ko).getTime() < reference.getTime();
    })
    .sort((a, b) => new Date(b.kickoffAt as string).getTime() - new Date(a.kickoffAt as string).getTime());

  const last = played[0];
  if (!last) return undefined;
  const diffMs = reference.getTime() - new Date(last.kickoffAt as string).getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

export async function safePbList(pb: Awaited<ReturnType<typeof ensureAdminAuth>>, name: string): Promise<PbRecord[]> {
  try {
    return (await pb.collection(name).getFullList()) as PbRecord[];
  } catch {
    return [];
  }
}

export function buildOddsMap(oddsRaw: PbRecord[]): Map<string, PbRecord> {
  const oddsByFixture = new Map<string, PbRecord>();
  for (const o of oddsRaw) oddsByFixture.set(String(o.fixtureId), o);
  return oddsByFixture;
}

export function buildTournamentStatsMap(tourStatsRaw: PbRecord[]): Map<string, TournamentStats> {
  const statsByCode = new Map<string, TournamentStats>();
  for (const s of tourStatsRaw) {
    statsByCode.set(s.teamCode as string, {
      xgPerGame: num(s.xgPerGame) ?? 0,
      gaPerGame: num(s.gaPerGame) ?? 0,
      gamesPlayed: num(s.gamesPlayed) ?? 0,
    });
  }
  return statsByCode;
}

export function buildH2HMap(h2hRaw: PbRecord[]): Map<string, PbRecord> {
  const h2hByPair = new Map<string, PbRecord>();
  for (const h of h2hRaw) h2hByPair.set(`${h.homeCode}|${h.awayCode}`, h);
  return h2hByPair;
}

export function buildMatchContext(
  match: PbRecord,
  matchesRaw: PbRecord[],
  now: Date,
  oddsByFixture: Map<string, PbRecord>,
  statsByCode: Map<string, TournamentStats>,
  h2hByPair: Map<string, PbRecord>,
): MatchContext {
  const context: MatchContext = {};

  const oddsRec = match.apiFixtureId ? oddsByFixture.get(String(match.apiFixtureId)) : undefined;
  if (oddsRec) {
    const h = num(oddsRec.oddsHome);
    const d = num(oddsRec.oddsDraw);
    const a = num(oddsRec.oddsAway);
    if (h != null && d != null && a != null) context.marketOdds = { home: h, draw: d, away: a };
  }

  const restHome = restDaysFor(match.homeCode as string, matchesRaw, now);
  const restAway = restDaysFor(match.awayCode as string, matchesRaw, now);
  if (restHome != null) context.restDaysHome = restHome;
  if (restAway != null) context.restDaysAway = restAway;

  const statsHome = statsByCode.get(match.homeCode as string);
  const statsAway = statsByCode.get(match.awayCode as string);
  if (statsHome && statsHome.gamesPlayed >= 1) context.tournamentStatsHome = statsHome;
  if (statsAway && statsAway.gamesPlayed >= 1) context.tournamentStatsAway = statsAway;

  const h2hRec = h2hByPair.get(`${match.homeCode}|${match.awayCode}`);
  if (h2hRec) {
    context.h2h = {
      homeWins: num(h2hRec.homeWins) ?? 0,
      draws: num(h2hRec.draws) ?? 0,
      awayWins: num(h2hRec.awayWins) ?? 0,
      total: num(h2hRec.total) ?? 0,
    };
  }

  return context;
}

export function selectPredictionTargets(matchesRaw: PbRecord[]): PbRecord[] {
  const withKickoff = matchesRaw.filter((m) => m.kickoffAt);
  const windowTargets = selectUpcomingWindow(withKickoff as { kickoffAt?: string }[])
    .sort((a, b) => new Date(a.kickoffAt as string).getTime() - new Date(b.kickoffAt as string).getTime());

  if (windowTargets.length) return windowTargets;

  return withKickoff
    .filter((m) => new Date(m.kickoffAt as string) > new Date())
    .sort((a, b) => new Date(a.kickoffAt as string).getTime() - new Date(b.kickoffAt as string).getTime())
    .slice(0, 5);
}

export function loadTeamsAndNews(teamsRaw: PbRecord[], newsRaw: PbRecord[]): { teams: Team[]; teamMap: Record<string, Team>; news: NewsItem[] } {
  const teams: Team[] = teamsRaw.length ? teamsRaw.map(mapTeamRecord) : SEED_DATA.teams;
  const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));
  const news = mapNewsFromPb(newsRaw);
  return { teams, teamMap, news };
}

export async function upsertPrediction(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  matchId: string,
  pred: MatchPrediction,
): Promise<void> {
  const existing = await pb.collection(COLLECTIONS.predictions).getFullList({
    filter: `matchId = "${matchId}"`,
  });

  const payload = {
    matchId,
    recommendedPick: pred.pick,
    pickKind: pred.pickKind,
    confidence: pred.conf,
    predictedScoreHome: pred.score[0],
    predictedScoreAway: pred.score[1],
    winHome: pred.winH,
    draw: pred.draw,
    winAway: pred.winA,
    keyReasons: pred.reasons,
    riskFactors: pred.risk,
    tag: pred.tag,
    dataFreshness: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };

  if (existing[0]) {
    await pb.collection(COLLECTIONS.predictions).update(existing[0].id, payload);
  } else {
    await pb.collection(COLLECTIONS.predictions).create(payload);
  }
}

export async function updateDashboardMeta(pb: Awaited<ReturnType<typeof ensureAdminAuth>>, matchesToday: number): Promise<void> {
  const metaRecords = await pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "dashboard"' });
  if (!metaRecords[0]) return;

  const value = metaRecords[0].value as Record<string, unknown>;
  await pb.collection(COLLECTIONS.meta).update(metaRecords[0].id, {
    value: {
      ...value,
      lastUpdate: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      lastUpdateAt: new Date().toISOString(),
      matchesToday,
    },
  });
}
