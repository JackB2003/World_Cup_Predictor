import { getPublicPocketBase } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapScorerRecord, mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import { predictMatch } from "@/features/predictions/match-engine";
import type { WorldCupData, Match, Team, Scorer, NewsItem, UserPicks, Meta, ModelWeight } from "@/types/world-cup";
import { formatKickoffTime, isToday, isTomorrowDate } from "@/lib/utils";

function useSeedFallback(): boolean {
  return process.env.USE_SEED_DATA === "true" || !process.env.POCKETBASE_URL;
}

export async function fetchWorldCupData(): Promise<WorldCupData> {
  if (useSeedFallback()) return SEED_DATA;

  try {
    const pb = getPublicPocketBase();

    const [teamsRaw, matchesRaw, predictionsRaw, scorersRaw, newsRaw, userPicksRaw, metaRaw, weightsRaw] =
      await Promise.all([
        pb.collection(COLLECTIONS.teams).getFullList({ sort: "-titleProb" }),
        pb.collection(COLLECTIONS.matches).getFullList({ sort: "kickoffAt" }),
        pb.collection(COLLECTIONS.predictions).getFullList(),
        pb.collection(COLLECTIONS.scorers).getFullList({ sort: "-prob" }),
        pb.collection(COLLECTIONS.news).getFullList(),
        pb.collection(COLLECTIONS.userPicks).getFullList(),
        pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "dashboard"' }),
        pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "modelWeights"' }),
      ]);

    const teams: Team[] = teamsRaw.map(mapTeamRecord);

    const teamMap: Record<string, Team> = {};
    teams.forEach((t) => { teamMap[t.code] = t; });

    for (const m of matchesRaw) {
      for (const code of [m.homeCode, m.awayCode]) {
        if (code && !teamMap[code]) {
          teamMap[code] = {
            code,
            name: code,
            color: "#6b7280",
            elo: 1500,
            fifa: 0,
            group: "",
            titleProb: 0,
            top4: 0,
            advance: 0,
            form: [],
            gf: 8,
            ga: 8,
            xg: 1.3,
            conf: "—",
            trend: 0,
          };
        }
      }
    }

    const predMap = new Map(predictionsRaw.map((p) => [p.matchId, p]));

    const news: NewsItem[] = newsRaw.map((n) => ({
      id: n.id,
      type: n.type,
      sev: n.sev,
      team: n.teamCode,
      title: n.title,
      time: n.timeLabel,
      impact: n.impact,
      body: n.body,
      icon: n.icon,
    }));

    const matches: Match[] = matchesRaw.map((m) => {
      const stored = predMap.get(m.matchId);
      const home = teamMap[m.homeCode];
      const away = teamMap[m.awayCode];
      // When no stored prediction exists yet (e.g. before the daily refresh
      // cron runs), compute one on the fly so the UI always reflects the data
      // instead of showing a flat 50% / 33-34-33 placeholder.
      const live = !stored && home && away ? predictMatch(home, away, news) : null;

      return {
        id: m.matchId,
        time: m.time || formatKickoffTime(m.kickoffAt),
        venue: m.venue ?? "",
        stage: m.stage ?? "",
        home: m.homeCode,
        away: m.awayCode,
        awayCode: m.awayCode,
        pick: stored?.recommendedPick ?? live?.pick ?? m.homeCode,
        pickKind: (stored?.pickKind ?? live?.pickKind ?? "win") as "win" | "draw",
        score: [
          stored?.predictedScoreHome ?? live?.score[0] ?? 0,
          stored?.predictedScoreAway ?? live?.score[1] ?? 0,
        ] as [number, number],
        conf: stored?.confidence ?? live?.conf ?? 50,
        winH: stored?.winHome ?? live?.winH ?? 33,
        draw: stored?.draw ?? live?.draw ?? 34,
        winA: stored?.winAway ?? live?.winA ?? 33,
        reasons: stored?.keyReasons ?? live?.reasons ?? [],
        risk: stored?.riskFactors ?? live?.risk ?? "",
        tag: stored?.tag ?? live?.tag ?? "Lean",
        kickoffAt: m.kickoffAt,
        status: m.status,
        apiFixtureId: m.apiFixtureId,
      };
    });

    const scorers: Scorer[] = scorersRaw.map(mapScorerRecord);

    const userRecord = userPicksRaw[0];
    const userPicks: UserPicks = userRecord
      ? {
          points: userRecord.points,
          rank: userRecord.rank,
          totalUsers: userRecord.totalUsers,
          accuracy: userRecord.accuracy,
          streak: userRecord.streak,
          top4: userRecord.top4,
          topScorer: userRecord.topScorer,
          history: userRecord.history,
          accuracyTrend: userRecord.accuracyTrend,
        }
      : SEED_DATA.userPicks;

    const meta: Meta = (metaRaw[0]?.value as Meta) ?? SEED_DATA.meta;
    const modelWeights: ModelWeight[] = (weightsRaw[0]?.value as ModelWeight[]) ?? SEED_DATA.modelWeights;

    const todayMatches = matches.filter((m) => m.kickoffAt && (isToday(m.kickoffAt) || isTomorrowDate(m.kickoffAt)));

    return {
      teams,
      teamMap,
      matches: todayMatches.length > 0 ? todayMatches : matches.filter((m) => m.kickoffAt && new Date(m.kickoffAt) > new Date()).slice(0, 5),
      scorers,
      news,
      userPicks,
      modelWeights,
      meta: { ...meta, matchesToday: todayMatches.length || meta.matchesToday },
    };
  } catch (err) {
    console.error("[fetchWorldCupData] PocketBase fetch failed, falling back to seed data:", err);
    return SEED_DATA;
  }
}
