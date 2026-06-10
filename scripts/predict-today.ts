import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { predictMatch } from "@/features/predictions/match-engine";
import { enhancePredictionReasoning } from "@/lib/openai/reasoning";
import {
  buildH2HMap,
  buildMatchContext,
  buildOddsMap,
  buildTournamentStatsMap,
  loadTeamsAndNews,
  safePbList,
  selectPredictionTargets,
  updateDashboardMeta,
  upsertPrediction,
} from "@/lib/scripts/predict-today-context";
import { runScript } from "@/lib/scripts/run-script";

async function main() {
  const pb = await ensureAdminAuth();
  const [teamsRaw, matchesRaw, newsRaw] = await Promise.all([
    pb.collection(COLLECTIONS.teams).getFullList(),
    pb.collection(COLLECTIONS.matches).getFullList(),
    pb.collection(COLLECTIONS.news).getFullList(),
  ]);

  const [oddsRaw, tourStatsRaw, h2hRaw] = await Promise.all([
    safePbList(pb, COLLECTIONS.matchOdds),
    safePbList(pb, COLLECTIONS.teamTournamentStats),
    safePbList(pb, COLLECTIONS.h2h),
  ]);

  const { teamMap, news } = loadTeamsAndNews(teamsRaw, newsRaw);
  const oddsByFixture = buildOddsMap(oddsRaw);
  const statsByCode = buildTournamentStatsMap(tourStatsRaw);
  const h2hByPair = buildH2HMap(h2hRaw);
  const now = new Date();
  const targets = selectPredictionTargets(matchesRaw);

  for (const m of targets) {
    const home = teamMap[m.homeCode as string];
    const away = teamMap[m.awayCode as string];
    if (!home || !away) {
      console.warn(`  skip ${m.matchId}: missing team data (${m.homeCode} / ${m.awayCode})`);
      continue;
    }

    const context = buildMatchContext(m, matchesRaw, now, oddsByFixture, statsByCode, h2hByPair);
    let pred = predictMatch(home, away, news, context);
    const enhanced = await enhancePredictionReasoning(home, away, pred);
    pred = { ...pred, reasons: enhanced.reasons, risk: enhanced.risk };

    await upsertPrediction(pb, m.matchId as string, pred);
    console.log(`  ${m.homeCode} vs ${m.awayCode}: ${pred.pick} (${pred.conf}%)`);
  }

  await updateDashboardMeta(pb, targets.length);
  console.log(`Generated ${targets.length} daily predictions.`);
}

runScript(main);
