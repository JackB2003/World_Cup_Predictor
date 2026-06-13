/**
 * Real 2026 WC group assignments, sourced directly from API-Football
 * (league=1, season=2026) /standings. Verified against the live API — all 12
 * groups have their full 4 teams. Used by sync.ts to reject genuine
 * cross-group contamination in fixture data.
 */
export const WC2026_GROUP_MAP: Record<string, string> = {
  MEX: "A", KOR: "A", CZE: "A", RSA: "A",
  CAN: "B", BIH: "B", QAT: "B", SUI: "B",
  BRA: "C", MAR: "C", HAI: "C", SCO: "C",
  USA: "D", AUS: "D", TUR: "D", PAR: "D",
  GER: "E", CUW: "E", CIV: "E", ECU: "E",
  NED: "F", JPN: "F", SWE: "F", TUN: "F",
  BEL: "G", EGY: "G", IRN: "G", NZL: "G",
  ESP: "H", CPV: "H", KSA: "H", URU: "H",
  FRA: "I", SEN: "I", IRQ: "I", NOR: "I",
  ARG: "J", ALG: "J", AUT: "J", JOR: "J",
  POR: "K", COD: "K", UZB: "K", COL: "K",
  ENG: "L", CRO: "L", GHA: "L", PAN: "L",
};
