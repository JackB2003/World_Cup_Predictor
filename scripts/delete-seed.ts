import { ensureAdminAuth } from "@/lib/pocketbase/admin";

async function main() {
  const pb = await ensureAdminAuth();

  // Delete seed matches m1-m5
  const matches = await pb.collection("matches").getFullList();
  const seedMatches = matches.filter((m: any) => ["m1","m2","m3","m4","m5"].includes(m.matchId));
  for (const m of seedMatches) {
    await pb.collection("matches").delete(m.id);
    console.log("Deleted match:", m.matchId);
  }

  // Delete predictions for m1-m5
  const preds = await pb.collection("predictions").getFullList();
  const seedPreds = preds.filter((p: any) => ["m1","m2","m3","m4","m5"].includes(p.matchId));
  for (const p of seedPreds) {
    await pb.collection("predictions").delete(p.id);
    console.log("Deleted prediction for:", p.matchId);
  }

  // Delete seed news (lineup, news, odds types)
  const news = await pb.collection("news").getFullList();
  const seedNews = news.filter((n: any) => ["lineup","news","odds"].includes(n.type));
  for (const n of seedNews) {
    await pb.collection("news").delete(n.id);
    console.log("Deleted news:", n.title?.slice(0,50));
  }

  console.log("Seed data cleanup complete.");
}

main().catch(console.error);
