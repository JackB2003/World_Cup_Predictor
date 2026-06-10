/**
 * Syncs real 2026 WC group assignments to PocketBase teams collection.
 * Groups derived from API-Football standings (by apiTeamId), with manual overrides
 * for SEN (wrong apiId) and PAN (wrong apiId). Run once before predict:top4.
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

const GROUP_MAP: Record<string, string> = {
  MEX: "A", RSA: "A", KOR: "A", CZE: "A",
  CAN: "B", BIH: "B", QAT: "B",
  BRA: "C", MAR: "C", HAI: "C", AUT: "C",
  USA: "D", PAR: "D", SUI: "D", TUR: "D",
  GER: "E", CUW: "E", CIV: "E", ECU: "E",
  NED: "F", JPN: "F", SWE: "F", ALG: "F",
  BEL: "G", EGY: "G", IRN: "G", NZL: "G",
  ESP: "H", CPV: "H", KSA: "H", URU: "H",
  FRA: "I", IRQ: "I", NOR: "I", SEN: "I",
  ARG: "J", TUN: "J", JOR: "J",
  POR: "K", COD: "K", UZB: "K", COL: "K",
  ENG: "L", CRO: "L", GHA: "L", PAN: "L",
};

async function main() {
  const pb = await ensureAdminAuth();
  const teams = await pb.collection(COLLECTIONS.teams).getFullList<{ id: string; code: string; group: string }>();

  let updated = 0;
  let unchanged = 0;
  let noMapping = 0;

  for (const team of teams) {
    const group = GROUP_MAP[team.code];
    if (!group) { noMapping++; continue; }
    if (team.group === group) { unchanged++; continue; }
    await pb.collection(COLLECTIONS.teams).update(team.id, { group });
    console.log(`  ${team.code}: ${team.group || "(none)"} → ${group}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${unchanged} unchanged, ${noMapping} not in 2026 WC draw`);

  // Summary
  const all = await pb.collection(COLLECTIONS.teams).getFullList<{ code: string; group: string }>();
  const grouped: Record<string, string[]> = {};
  for (const t of all) {
    if (t.group) { grouped[t.group] = grouped[t.group] ?? []; grouped[t.group].push(t.code); }
  }
  console.log("\nGroups after update:");
  for (const g of Object.keys(grouped).sort()) {
    console.log(`  Group ${g}: ${grouped[g].sort().join(", ")} (${grouped[g].length} teams)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
