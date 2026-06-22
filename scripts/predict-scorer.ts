import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapScorerRecord, mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import { rankScorers } from "@/features/scorer/projections";
import { runWithPocketBaseFallback } from "@/lib/scripts/fallback";
import type { Scorer, Team } from "@/types/world-cup";

function logTopScorers(ranked: ReturnType<typeof rankScorers>) {
  ranked.slice(0, 5).forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${s.player}${s.team ? ` (${s.team})` : ""} — ${s.goals}g actual, ${s.proj} proj, ${s.prob}% Golden Boot`,
    );
  });
}

async function main() {
  let scorers: Scorer[] = SEED_DATA.scorers;
  let teams: Team[] = SEED_DATA.teams;

  await runWithPocketBaseFallback(
    async () => {
      const pb = await ensureAdminAuth();
      const [scorersRaw, teamsRaw] = await Promise.all([
        pb.collection(COLLECTIONS.scorers).getFullList(),
        pb.collection(COLLECTIONS.teams).getFullList(),
      ]);

      if (scorersRaw.length) scorers = scorersRaw.map(mapScorerRecord);
      if (teamsRaw.length) teams = teamsRaw.map(mapTeamRecord);

      const ranked = rankScorers(scorers, teams);

      for (const s of ranked) {
        const existing = await pb.collection(COLLECTIONS.scorers).getFullList({
          filter: `player = "${s.player.replace(/"/g, '\\"')}"`,
        });
        if (existing[0]) {
          await pb.collection(COLLECTIONS.scorers).update(existing[0].id, {
            proj: s.proj,
            prob: s.prob,
            // Only update projection fields — goals/gamesPlayed are managed by import:topscorers
            projectedMatches: s.projectedMatches,
            groupDifficulty: s.groupDifficulty,
          });
        }
      }

      await pb.collection(COLLECTIONS.tournamentPredictions).create({
        type: "top_scorer",
        results: ranked.slice(0, 10),
        simRuns: 1,
        createdAt: new Date().toISOString(),
      });

      console.log("Top scorer projections:");
      return ranked;
    },
    () => rankScorers(scorers, teams),
    { label: "local projections", log: logTopScorers },
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
