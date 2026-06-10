import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

async function main() {
  const pb = await ensureAdminAuth();
  const [history, userPicks] = await Promise.all([
    pb.collection(COLLECTIONS.predictionHistory).getFullList(),
    pb.collection(COLLECTIONS.userPicks).getFullList({ sort: "-created" }),
  ]);

  if (!userPicks[0]) {
    console.log("No user picks record found.");
    return;
  }

  const hits = history.filter((h) => h.wasCorrect).length;
  const total = history.length || 1;
  const accuracy = Math.round((hits / total) * 100);
  const points = history.reduce((sum, h) => sum + (h.pointsEarned ?? 0), 0);

  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].wasCorrect) streak++;
    else break;
  }

  await pb.collection(COLLECTIONS.userPicks).update(userPicks[0].id, {
    accuracy,
    points,
    streak,
  });

  console.log(`Graded picks: ${accuracy}% accuracy, ${points} points, streak ${streak}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
