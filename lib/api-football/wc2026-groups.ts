/**
 * Real 2026 WC group assignments derived from API-Football standings (by apiTeamId).
 * Notes on code mismatches due to import artifacts:
 *   AUT (apiId=1108) = Scotland in the real draw (Group C)
 *   SUI (apiId=20)   = Australia in the real draw (Group D)
 *   ALG (apiId=28)   = Tunisia in the real draw   (Group F)
 *   TUN (apiId=1532) = Algeria in the real draw   (Group J)
 *   SEN and PAN manually assigned to their real groups.
 *   Groups B and J have 3 teams (4th not resolvable from PB data).
 */
export const WC2026_GROUP_MAP: Record<string, string> = {
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
