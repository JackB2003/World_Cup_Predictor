import { getPublicPocketBase } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { SEED_DATA } from "@/lib/data/seed";
import { selectDisplayMatches, selectUpcomingWindow, resolveTournamentKickoff } from "@/lib/data/match-window";
import {
  buildTeamMap,
  mapMatchesFromPb,
  mapMetaFromPb,
  mapNewsFromPb,
  mapScorersFromPb,
  mapTeamsFromPb,
  mapUserPicksFromPb,
} from "@/lib/data/world-cup-mappers";
import type { WorldCupData } from "@/types/world-cup";

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
        pb.collection(COLLECTIONS.userPicks).getFullList({ sort: "id" }),
        pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "dashboard"' }),
        pb.collection(COLLECTIONS.meta).getFullList({ filter: 'key = "modelWeights"' }),
      ]);

    const teams = mapTeamsFromPb(teamsRaw);
    const teamMap = buildTeamMap(teams, matchesRaw);
    const news = mapNewsFromPb(newsRaw);
    const matches = mapMatchesFromPb(matchesRaw, teamMap, predictionsRaw, news);
    const scorers = mapScorersFromPb(scorersRaw);
    const userPicks = mapUserPicksFromPb(userPicksRaw);
    const { meta, modelWeights } = mapMetaFromPb(metaRaw, weightsRaw);
    const todayMatches = selectUpcomingWindow(matches);

    return {
      teams,
      teamMap,
      matches: selectDisplayMatches(matches),
      scorers,
      news,
      userPicks,
      modelWeights,
      meta: {
        ...meta,
        kickoff: resolveTournamentKickoff(matches, meta.kickoff),
        matchesToday: todayMatches.length || meta.matchesToday,
      },
    };
  } catch (err) {
    console.error("[fetchWorldCupData] PocketBase fetch failed, falling back to seed data:", err);
    return SEED_DATA;
  }
}
