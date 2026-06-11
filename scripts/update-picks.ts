/**
 * Sync your locked one-time tournament picks into PocketBase.
 * Edit SEED_DATA.userPicks in lib/data/seed.ts with your picks, then run: npm run picks:sync
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { SEED_DATA } from "@/lib/data/seed";

async function main() {
  const pb = await ensureAdminAuth();
  const records = await pb.collection(COLLECTIONS.userPicks).getFullList({ sort: "id" });

  const payload = {
    top4: SEED_DATA.userPicks.top4,
    topScorer: SEED_DATA.userPicks.topScorer,
    points: 0,
    rank: 0,
    totalUsers: 1,
    accuracy: 0,
    streak: 0,
    history: [],
    accuracyTrend: [],
  };

  if (records[0]) {
    await pb.collection(COLLECTIONS.userPicks).update(records[0].id, payload);
    console.log("Updated picks and reset pre-tournament stats:");
  } else {
    await pb.collection(COLLECTIONS.userPicks).create(payload);
    console.log("Created user_picks:");
  }

  for (const p of payload.top4) {
    console.log(`  ${p.pos}. ${p.team} — ${p.note}`);
  }
  console.log(`  Top scorer: ${payload.topScorer.player} (${payload.topScorer.team})`);
  console.log("  Stats reset: points=0, accuracy=0, streak=0, history=[], accuracyTrend=[]");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
