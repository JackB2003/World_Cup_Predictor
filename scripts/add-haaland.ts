import { ensureAdminAuth } from "@/lib/pocketbase/admin";

async function main() {
  const pb = await ensureAdminAuth();
  const existing = await pb.collection("scorers").getFullList({
    filter: 'player="Erling Haaland"',
  });
  if (existing.length) {
    console.log("Haaland already exists, id:", existing[0].id);
    return;
  }
  const rec = await pb.collection("scorers").create({
    player: "Erling Haaland",
    teamCode: "NOR",
    position: "FWD",
    goals: 0,
    g90: 0.95,
    minutes: 85,
    pens: true,
    injuryRisk: "Medium",
    note: "World-class finisher and penalty taker. Medium injury risk the only drag. Norway in tough Group I (France).",
    conf: 76,
    trend: 0,
    proj: 0,
    prob: 0,
    projectedMatches: 4,
    groupDifficulty: 0.96,
  });
  console.log("Added Haaland:", rec.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
