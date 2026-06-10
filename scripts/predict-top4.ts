import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import { runMonteCarlo } from "@/features/simulation/monte-carlo";
import { runWithPocketBaseFallback } from "@/lib/scripts/fallback";
import type { Team } from "@/types/world-cup";

function logTopFour(output: ReturnType<typeof runMonteCarlo>) {
  output.topFour.forEach((t) => {
    console.log(`  ${t.position}. ${t.teamCode} — ${t.probability}% top-4`);
  });
}

async function main() {
  let teams: Team[] = SEED_DATA.teams;

  await runWithPocketBaseFallback(
    async () => {
      const pb = await ensureAdminAuth();
      const raw = await pb.collection(COLLECTIONS.teams).getFullList();
      if (raw.length) teams = raw.map(mapTeamRecord);

      const output = runMonteCarlo(teams, 10000);

      for (const r of output.results) {
        const existing = await pb.collection(COLLECTIONS.teams).getFullList({
          filter: `code = "${r.teamCode}"`,
        });
        if (existing[0]) {
          await pb.collection(COLLECTIONS.teams).update(existing[0].id, {
            titleProb: r.titleProb,
            top4: r.top4Prob,
            advance: r.advanceProb,
            lastUpdated: new Date().toISOString(),
          });
        }
      }

      await pb.collection(COLLECTIONS.tournamentPredictions).create({
        type: "top4",
        results: output,
        simRuns: output.simRuns,
        createdAt: new Date().toISOString(),
      });

      console.log("Top 4 simulation complete:");
      return output;
    },
    () => runMonteCarlo(teams, 10000),
    { label: "local simulation only", log: logTopFour },
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
