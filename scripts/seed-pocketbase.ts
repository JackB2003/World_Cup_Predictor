import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { WC2026_TEAMS } from "@/lib/api-football/wc2026-teams";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { SEED_DATA } from "@/lib/data/seed";

const API_TEAM_ID_BY_CODE = Object.fromEntries(WC2026_TEAMS.map((t) => [t.code, t.apiTeamId]));

async function clearCollection(pb: Awaited<ReturnType<typeof ensureAdminAuth>>, name: string) {
  const records = await pb.collection(name).getFullList({ fields: "id" });
  for (const r of records) {
    await pb.collection(name).delete(r.id);
  }
}

async function main() {
  const pb = await ensureAdminAuth();
  console.log("Seeding PocketBase from design mock data...");

  await clearCollection(pb, COLLECTIONS.teams);
  for (const t of SEED_DATA.teams) {
    await pb.collection(COLLECTIONS.teams).create({
      code: t.code,
      name: t.name,
      color: t.color,
      txt: t.txt ?? "",
      group: t.group,
      elo: t.elo,
      fifa: t.fifa,
      titleProb: t.titleProb,
      top4: t.top4,
      advance: t.advance,
      form: t.form,
      gf: t.gf,
      ga: t.ga,
      xg: t.xg,
      conf: t.conf,
      trend: t.trend,
      host: t.host ?? false,
      apiTeamId: API_TEAM_ID_BY_CODE[t.code],
      lastUpdated: new Date().toISOString(),
    });
  }

  await clearCollection(pb, COLLECTIONS.matches);
  const kickoffBase = new Date();
  kickoffBase.setHours(13, 0, 0, 0);
  for (const [i, m] of SEED_DATA.matches.entries()) {
    const kickoff = new Date(kickoffBase);
    kickoff.setHours(kickoff.getHours() + i * 3);
    await pb.collection(COLLECTIONS.matches).create({
      matchId: m.id,
      kickoffAt: kickoff.toISOString(),
      time: m.time,
      venue: m.venue,
      stage: m.stage,
      homeCode: m.home,
      awayCode: m.awayCode,
      status: "scheduled",
      lastUpdated: new Date().toISOString(),
    });
  }

  await clearCollection(pb, COLLECTIONS.predictions);
  for (const m of SEED_DATA.matches) {
    await pb.collection(COLLECTIONS.predictions).create({
      matchId: m.id,
      recommendedPick: m.pick,
      pickKind: m.pickKind,
      confidence: m.conf,
      predictedScoreHome: m.score[0],
      predictedScoreAway: m.score[1],
      winHome: m.winH,
      draw: m.draw,
      winAway: m.winA,
      keyReasons: m.reasons,
      riskFactors: m.risk,
      tag: m.tag,
      dataFreshness: SEED_DATA.meta.lastUpdate,
    });
  }

  await clearCollection(pb, COLLECTIONS.scorers);
  for (const s of SEED_DATA.scorers) {
    await pb.collection(COLLECTIONS.scorers).create({
      player: s.player,
      teamCode: s.team,
      position: s.pos,
      proj: s.proj,
      prob: s.prob,
      goals: s.goals,
      g90: s.g90,
      pens: s.pens,
      minutes: s.minutes,
      conf: s.conf,
      trend: s.trend,
      note: s.note,
      projectedMatches: s.projectedMatches ?? 7,
      groupDifficulty: s.groupDifficulty ?? 0.95,
      injuryRisk: s.injuryRisk ?? "Low",
    });
  }

  await clearCollection(pb, COLLECTIONS.news);
  // Injury/suspension rows come from API-Football on refresh — seed only display news.
  for (const n of SEED_DATA.news.filter((item) => item.type !== "injury" && item.type !== "suspension")) {
    await pb.collection(COLLECTIONS.news).create({
      type: n.type,
      sev: n.sev,
      teamCode: n.team,
      title: n.title,
      timeLabel: n.time,
      impact: n.impact,
      body: n.body,
      icon: n.icon,
    });
  }

  await clearCollection(pb, COLLECTIONS.userPicks);
  await pb.collection(COLLECTIONS.userPicks).create({
    points: SEED_DATA.userPicks.points,
    rank: SEED_DATA.userPicks.rank,
    totalUsers: SEED_DATA.userPicks.totalUsers,
    accuracy: SEED_DATA.userPicks.accuracy,
    streak: SEED_DATA.userPicks.streak,
    top4: SEED_DATA.userPicks.top4,
    topScorer: SEED_DATA.userPicks.topScorer,
    history: SEED_DATA.userPicks.history,
    accuracyTrend: SEED_DATA.userPicks.accuracyTrend,
  });

  await clearCollection(pb, COLLECTIONS.predictionHistory);
  for (const h of SEED_DATA.userPicks.history) {
    await pb.collection(COLLECTIONS.predictionHistory).create({
      matchLabel: h.match,
      userPick: h.pick,
      aiPick: h.aiPick ?? h.pick,
      finalResult: h.score,
      wasCorrect: h.result === "hit",
      pointsEarned: h.pts,
      notes: h.score,
    });
  }

  await clearCollection(pb, COLLECTIONS.meta);
  await pb.collection(COLLECTIONS.meta).create({ key: "dashboard", value: SEED_DATA.meta });
  await pb.collection(COLLECTIONS.meta).create({ key: "modelWeights", value: SEED_DATA.modelWeights });

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
