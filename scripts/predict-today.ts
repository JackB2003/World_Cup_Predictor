import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import { SEED_DATA } from "@/lib/data/seed";
import { predictMatch } from "@/features/predictions/match-engine";
import { enhancePredictionReasoning } from "@/lib/openai/reasoning";
import type { Team, NewsItem } from "@/types/world-cup";
import { isToday } from "@/lib/utils";

async function main() {
  try {
    const pb = await ensureAdminAuth();
    const [teamsRaw, matchesRaw, newsRaw] = await Promise.all([
      pb.collection(COLLECTIONS.teams).getFullList(),
      pb.collection(COLLECTIONS.matches).getFullList(),
      pb.collection(COLLECTIONS.news).getFullList(),
    ]);

    const teams: Team[] = teamsRaw.length ? teamsRaw.map(mapTeamRecord) : SEED_DATA.teams;

    const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));
    const news: NewsItem[] = newsRaw.map((n) => ({
      type: n.type, sev: n.sev, team: n.teamCode, title: n.title,
      time: n.timeLabel, impact: n.impact, body: n.body, icon: n.icon,
    }));

    const todayMatches = matchesRaw.filter((m) => m.kickoffAt && isToday(m.kickoffAt));
    const targets = todayMatches.length ? todayMatches : matchesRaw.slice(0, 5);

    for (const m of targets) {
      const home = teamMap[m.homeCode];
      const away = teamMap[m.awayCode];
      if (!home || !away) continue;

      let pred = predictMatch(home, away, news);
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
