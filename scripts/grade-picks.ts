import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { formatMatchLabel, gradePick } from "@/features/picks/daily-picks";

const FINISHED = new Set(["FT", "AET", "PEN"]);

async function main() {
  const pb = await ensureAdminAuth();

  const [dailyPicks, userPicks, matches, predictions, existingHistory] = await Promise.all([
    pb.collection(COLLECTIONS.userDailyPicks).getFullList({ filter: "graded != true" }),
    pb.collection(COLLECTIONS.userPicks).getFullList({ sort: "id" }),
    pb.collection(COLLECTIONS.matches).getFullList(),
    pb.collection(COLLECTIONS.predictions).getFullList(),
    pb.collection(COLLECTIONS.predictionHistory).getFullList(),
  ]);

  if (!userPicks[0]) {
    console.log("No user picks record found.");
    return;
  }

  const matchMap = new Map(matches.map((m) => [m.matchId, m]));
  const predMap = new Map(predictions.map((p) => [p.matchId, p]));
  const gradedMatchIds = new Set(existingHistory.map((h) => h.matchLabel));

  let newlyGraded = 0;

  for (const pick of dailyPicks) {
    const match = matchMap.get(pick.matchId);
    if (!match || !FINISHED.has(match.status ?? "")) continue;
    if (match.scoreHome == null || match.scoreAway == null) continue;

    const label = formatMatchLabel(match.homeCode, match.awayCode, match.scoreHome, match.scoreAway);
    if (gradedMatchIds.has(label)) {
      await pb.collection(COLLECTIONS.userDailyPicks).update(pick.id, { graded: true });
      continue;
    }

    const correct = gradePick(pick.pickTeam, match.homeCode, match.awayCode, match.scoreHome, match.scoreAway);
    const pred = predMap.get(pick.matchId);
    const aiPick =
      pred?.pickKind === "draw"
        ? "Draw"
        : `${pred?.recommendedPick ?? ""} Win`;

    await pb.collection(COLLECTIONS.predictionHistory).create({
      matchLabel: label,
      userPick: pick.pickLabel,
      aiPick,
      finalResult: `${match.scoreHome}–${match.scoreAway}`,
      wasCorrect: correct,
      pointsEarned: correct ? 30 : 0,
      notes: correct ? "winner correct" : "miss",
    });

    await pb.collection(COLLECTIONS.userDailyPicks).update(pick.id, { graded: true });
    gradedMatchIds.add(label);
    newlyGraded++;
    console.log(`  Graded ${label}: ${pick.pickLabel} → ${correct ? "HIT" : "MISS"}`);
  }

  const history = await pb.collection(COLLECTIONS.predictionHistory).getFullList();
  const hits = history.filter((h) => h.wasCorrect).length;
  const total = history.length || 1;
  const accuracy = Math.round((hits / total) * 100);
  const points = history.reduce((sum, h) => sum + (h.pointsEarned ?? 0), 0);

  let streak = 0;
  const sorted = [...history].sort((a, b) => (a.created > b.created ? 1 : -1));
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].wasCorrect) streak++;
    else break;
  }

  const trend = userPicks[0].accuracyTrend ?? [];
  const nextTrend = [...trend.slice(-6), accuracy];

  const historyJson = sorted.map((h) => ({
    match: h.matchLabel,
    pick: h.userPick,
    aiPick: h.aiPick,
    result: h.wasCorrect ? ("hit" as const) : ("miss" as const),
    pts: h.pointsEarned ?? 0,
    score: h.finalResult,
  }));

  await pb.collection(COLLECTIONS.userPicks).update(userPicks[0].id, {
    accuracy,
    points,
    streak,
    accuracyTrend: nextTrend,
    history: historyJson,
  });

  // Verify stored history matches source of truth
  const verified = await pb.collection(COLLECTIONS.userPicks).getOne(userPicks[0].id);
  const storedCount = (verified.history ?? []).length;
  if (storedCount !== history.length) {
    console.error(
      `HISTORY MISMATCH: stored ${storedCount} records but prediction_history has ${history.length}. Run grade:picks again.`,
    );
    process.exit(1);
  }
  console.log(`✓ history integrity: ${storedCount}/${history.length} records stored correctly`);

  console.log(
    newlyGraded > 0
      ? `Graded ${newlyGraded} new pick(s): ${accuracy}% accuracy, ${points} points, streak ${streak}`
      : `No new picks to grade. Current: ${accuracy}% accuracy, ${points} points, streak ${streak}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
