import { predictMatch } from "@/features/predictions/match-engine";
import { mapScorerRecord, mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import { formatKickoffTime } from "@/lib/utils";
import type { Match, Meta, ModelWeight, NewsItem, Scorer, Team, UserPicks } from "@/types/world-cup";

type PbRecord = Record<string, unknown>;

export function mapTeamsFromPb(teamsRaw: PbRecord[]): Team[] {
  return teamsRaw.map(mapTeamRecord);
}

export function buildTeamMap(teams: Team[], matchesRaw: PbRecord[]): Record<string, Team> {
  const teamMap: Record<string, Team> = {};
  teams.forEach((t) => { teamMap[t.code] = t; });

  for (const m of matchesRaw) {
    for (const code of [m.homeCode, m.awayCode]) {
      if (typeof code !== "string" || !code || teamMap[code]) continue;
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

  return teamMap;
}

export function mapNewsFromPb(newsRaw: PbRecord[]): NewsItem[] {
  return newsRaw.map((n) => ({
    id: n.id as string | undefined,
    type: n.type as NewsItem["type"],
    sev: n.sev as NewsItem["sev"],
    team: n.teamCode as string,
    title: n.title as string,
    time: n.timeLabel as string,
    impact: n.impact as string,
    body: n.body as string,
    icon: n.icon as string,
  }));
}

export function mapMatchesFromPb(
  matchesRaw: PbRecord[],
  teamMap: Record<string, Team>,
  predictionsRaw: PbRecord[],
  news: NewsItem[],
): Match[] {
  const predMap = new Map(predictionsRaw.map((p) => [p.matchId, p]));

  return matchesRaw.map((m) => {
    const stored = predMap.get(m.matchId);
    const home = teamMap[m.homeCode as string];
    const away = teamMap[m.awayCode as string];
    const live = !stored && home && away ? predictMatch(home, away, news) : null;

    return {
      id: m.matchId as string,
      time: (m.time as string) || formatKickoffTime(m.kickoffAt as string | undefined),
      venue: (m.venue as string) ?? "",
      stage: (m.stage as string) ?? "",
      home: m.homeCode as string,
      away: m.awayCode as string,
      awayCode: m.awayCode as string,
      pick: (stored?.recommendedPick as string) ?? live?.pick ?? (m.homeCode as string),
      pickKind: ((stored?.pickKind as string) ?? live?.pickKind ?? "win") as "win" | "draw",
      score: [
        (stored?.predictedScoreHome as number) ?? live?.score[0] ?? 0,
        (stored?.predictedScoreAway as number) ?? live?.score[1] ?? 0,
      ] as [number, number],
      conf: (stored?.confidence as number) ?? live?.conf ?? 50,
      winH: (stored?.winHome as number) ?? live?.winH ?? 33,
      draw: (stored?.draw as number) ?? live?.draw ?? 34,
      winA: (stored?.winAway as number) ?? live?.winA ?? 33,
      reasons: (stored?.keyReasons as string[]) ?? live?.reasons ?? [],
      risk: (stored?.riskFactors as string) ?? live?.risk ?? "",
      tag: (stored?.tag as string) ?? live?.tag ?? "Lean",
      kickoffAt: m.kickoffAt as string | undefined,
      status: m.status as string | undefined,
      apiFixtureId: m.apiFixtureId as number | undefined,
    };
  });
}

export function mapScorersFromPb(scorersRaw: PbRecord[]): Scorer[] {
  return scorersRaw.map(mapScorerRecord);
}

export function mapUserPicksFromPb(userPicksRaw: PbRecord[]): UserPicks {
  const userRecord = userPicksRaw[0];
  if (!userRecord) return SEED_DATA.userPicks;
  return {
    points: userRecord.points as number,
    rank: userRecord.rank as number,
    totalUsers: userRecord.totalUsers as number,
    accuracy: userRecord.accuracy as number,
    streak: userRecord.streak as number,
    top4: userRecord.top4 as UserPicks["top4"],
    topScorer: userRecord.topScorer as UserPicks["topScorer"],
    history: userRecord.history as UserPicks["history"],
    accuracyTrend: userRecord.accuracyTrend as number[],
  };
}

export function mapMetaFromPb(metaRaw: PbRecord[], weightsRaw: PbRecord[]): { meta: Meta; modelWeights: ModelWeight[] } {
  return {
    meta: (metaRaw[0]?.value as Meta) ?? SEED_DATA.meta,
    modelWeights: (weightsRaw[0]?.value as ModelWeight[]) ?? SEED_DATA.modelWeights,
  };
}
