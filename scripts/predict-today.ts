import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import { predictMatch, type MatchContext } from "@/features/predictions/match-engine";
import { enhancePredictionReasoning } from "@/lib/openai/reasoning";
import type { Team, NewsItem } from "@/types/world-cup";
import type { TournamentStats } from "@/features/predictions/score-model";
import { isToday } from "@/lib/utils";

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

async function main() {
  try {
    const pb = await ensureAdminAuth();
    const [teamsRaw, matchesRaw, newsRaw] = await Promise.all([
      pb.collection(COLLECTIONS.teams).getFullList(),
      pb.collection(COLLECTIONS.matches).getFullList(),
      pb.collection(COLLECTIONS.news).getFullList(),
    ]);

    // Context collections may not exist yet (first run before imports) — degrade gracefully.
    const safeList = async (name: string): Promise<PbRecord[]> => {
      try {
        return (await pb.collection(name).getFullList()) as PbRecord[];
      } catch {
        return [];
      }
    };
    const [oddsRaw, tourStatsRaw, h2hRaw] = await Promise.all([
      safeList(COLLECTIONS.matchOdds),
      safeList(COLLECTIONS.teamTournamentStats),
      safeList(COLLECTIONS.h2h),
    ]);

    const teams: Team[] = teamsRaw.length ? teamsRaw.map(mapTeamRecord) : SEED_DATA.teams;
    const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));
    const news: NewsItem[] = newsRaw.map((n) => ({
      type: n.type, sev: n.sev, team: n.teamCode, title: n.title,
      time: n.timeLabel, impact: n.impact, body: n.body, icon: n.icon,
    }));

    const oddsByFixture = new Map<string, PbRecord>();
    for (const o of oddsRaw) oddsByFixture.set(String(o.fixtureId), o);

    const statsByCode = new Map<string, TournamentStats>();
    for (const s of tourStatsRaw) {
      statsByCode.set(s.teamCode as string, {
        xgPerGame: (num(s.xgPerGame) ?? 0),
        gaPerGame: (num(s.gaPerGame) ?? 0),
        gamesPlayed: (num(s.gamesPlayed) ?? 0),
      });
    }

    const h2hByPair = new Map<string, PbRecord>();
    for (const h of h2hRaw) h2hByPair.set(`${h.homeCode}|${h.awayCode}`, h);

    const now = new Date();
    const todayMatches = matchesRaw.filter((m) => m.kickoffAt && isToday(m.kickoffAt));
    const targets = todayMatches.length ? todayMatches : matchesRaw.slice(0, 5);

    for (const m of targets) {
      const home = teamMap[m.homeCode];
      const away = teamMap[m.awayCode];
      if (!home || !away) {
        console.warn(`  skip ${m.matchId}: missing team data (${m.homeCode} / ${m.awayCode})`);
        continue;
      }

      const context: MatchContext = {};

      const oddsRec = m.apiFixtureId ? oddsByFixture.get(String(m.apiFixtureId)) : undefined;
      if (oddsRec) {
        const h = num(oddsRec.oddsHome);
        const d = num(oddsRec.oddsDraw);
        const a = num(oddsRec.oddsAway);
        if (h != null && d != null && a != null) context.marketOdds = { home: h, draw: d, away: a };
      }

      const restHome = restDaysFor(m.homeCode, matchesRaw, now);
      const restAway = restDaysFor(m.awayCode, matchesRaw, now);
      if (restHome != null) context.restDaysHome = restHome;
      if (restAway != null) context.restDaysAway = restAway;

      const statsHome = statsByCode.get(m.homeCode);
      const statsAway = statsByCode.get(m.awayCode);
      if (statsHome && statsHome.gamesPlayed >= 1) context.tournamentStatsHome = statsHome;
      if (statsAway && statsAway.gamesPlayed >= 1) context.tournamentStatsAway = statsAway;

      const h2hRec = h2hByPair.get(`${m.homeCode}|${m.awayCode}`);
      if (h2hRec) {
        context.h2h = {
          homeWins: num(h2hRec.homeWins) ?? 0,
          draws: num(h2hRec.draws) ?? 0,
          awayWins: num(h2hRec.awayWins) ?? 0,
          total: num(h2hRec.total) ?? 0,
        };
      }

      let pred = predictMatch(home, away, news, context);
      const enhanced = await enhancePredictionReasoning(home, away, pred);
      pred = { ...pred, reasons: enhanced.reasons, risk: enhanced.risk };

      const existing = await pb.collection(COLLECTIONS.predictions).getFullList({
        filter: `matchId = "${m.matchId}"`,
      });

      const payload = {
        matchId: m.matchId,
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

      console.log(`  ${m.homeCode} vs ${m.awayCode}: ${pred.pick} (${pred.conf}%)`);
    }

    const metaRecords = await pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "dashboard"' });
    if (metaRecords[0]) {
      const value = metaRecords[0].value as Record<string, unknown>;
      await pb.collection(COLLECTIONS.meta).update(metaRecords[0].id, {
        value: {
          ...value,
          lastUpdate: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          lastUpdateAt: new Date().toISOString(),
          matchesToday: targets.length,
        },
      });
    }

    console.log(`Generated ${targets.length} daily predictions.`);
  } catch (err) {
    console.error("predict-today failed:", err);
    process.exit(1);
  }
}

main();
