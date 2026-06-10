import { getPublicPocketBase } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapScorerRecord, mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import type { WorldCupData, Match, Team, Scorer, NewsItem, UserPicks, Meta, ModelWeight } from "@/types/world-cup";
import { formatKickoffTime, isToday } from "@/lib/utils";

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
        pb.collection(COLLECTIONS.userPicks).getFullList({ sort: "-created" }),
        pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "dashboard"' }),
        pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "modelWeights"' }),
      ]);

    const teams: Team[] = teamsRaw.map(mapTeamRecord);

    const teamMap: Record<string, Team> = {};
    teams.forEach((t) => { teamMap[t.code] = t; });

    const predMap = new Map(predictionsRaw.map((p) => [p.matchId, p]));

    const matches: Match[] = matchesRaw.map((m) => {
      const pred = predMap.get(m.matchId);
      return {
        id: m.matchId,
        time: m.time || formatKickoffTime(m.kickoffAt),
        venue: m.venue ?? "",
        stage: m.stage ?? "",
        home: m.homeCode,
        away: m.awayCode,
        awayCode: m.awayCode,
        pick: pred?.recommendedPick ?? m.homeCode,
        pickKind: (pred?.pickKind ?? "win") as "win" | "draw",
        score: [pred?.predictedScoreHome ?? 0, pred?.predictedScoreAway ?? 0] as [number, number],
        conf: pred?.confidence ?? 50,
        winH: pred?.winHome ?? 33,
        draw: pred?.draw ?? 34,
        winA: pred?.winAway ?? 33,
        reasons: pred?.keyReasons ?? [],
        risk: pred?.riskFactors ?? "",
        tag: pred?.tag ?? "Lean",
        kickoffAt: m.kickoffAt,
        status: m.status,
        apiFixtureId: m.apiFixtureId,
      };
    });

    const scorers: Scorer[] = scorersRaw.map(mapScorerRecord);

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

    const todayMatches = matches.filter((m) => m.kickoffAt && isToday(m.kickoffAt));

    return {
      teams,
      teamMap,
      matches: todayMatches.length > 0 ? todayMatches : matches.slice(0, 5),
      scorers,
      news,
      userPicks,
      modelWeights,
      meta: { ...meta, matchesToday: todayMatches.length || meta.matchesToday },
    };
  } catch {
    return SEED_DATA;
  }
}
