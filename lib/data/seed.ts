import type { WorldCupData } from "@/types/world-cup";

const teams = [
  { code: "ARG", name: "Argentina", color: "#6CACE4", elo: 2143, fifa: 1, group: "A", titleProb: 14.2, top4: 41, advance: 99, form: ["W", "W", "W", "D", "W"] as const, gf: 12, ga: 3, xg: 2.4, conf: "Reigning champions, elite spine", trend: 1 },
  { code: "FRA", name: "France", color: "#1E2A78", elo: 2118, fifa: 2, group: "F", titleProb: 11.6, top4: 38, advance: 98, form: ["W", "W", "D", "W", "W"] as const, gf: 14, ga: 4, xg: 2.6, conf: "Devastating pace in transition", trend: 0 },
  { code: "ESP", name: "Spain", color: "#C60B1E", elo: 2095, fifa: 3, group: "E", titleProb: 10.8, top4: 36, advance: 97, form: ["W", "W", "W", "W", "D"] as const, gf: 16, ga: 5, xg: 2.7, conf: "Best ball progression in the field", trend: 1 },
  { code: "ENG", name: "England", color: "#FFFFFF", txt: "#0E1422", elo: 2070, fifa: 4, group: "C", titleProb: 9.1, top4: 33, advance: 96, form: ["W", "D", "W", "W", "L"] as const, gf: 11, ga: 4, xg: 2.1, conf: "Deepest attacking roster", trend: 1 },
  { code: "BRA", name: "Brazil", color: "#FFD200", txt: "#0E1422", elo: 2061, fifa: 5, group: "G", titleProb: 8.7, top4: 31, advance: 95, form: ["W", "L", "W", "W", "W"] as const, gf: 13, ga: 6, xg: 2.3, conf: "Individual quality, defensive questions", trend: -1 },
  { code: "POR", name: "Portugal", color: "#046A38", elo: 2038, fifa: 6, group: "H", titleProb: 7.3, top4: 27, advance: 93, form: ["W", "W", "D", "L", "W"] as const, gf: 12, ga: 7, xg: 2.2, conf: "Golden generation, final shot", trend: 0 },
  { code: "GER", name: "Germany", color: "#111418", elo: 2024, fifa: 9, group: "D", titleProb: 6.4, top4: 24, advance: 91, form: ["D", "W", "W", "D", "W"] as const, gf: 10, ga: 6, xg: 1.9, conf: "Rebuilt, momentum building", trend: 1 },
  { code: "NED", name: "Netherlands", color: "#FF6B1A", elo: 2012, fifa: 7, group: "B", titleProb: 5.5, top4: 22, advance: 90, form: ["W", "D", "W", "L", "W"] as const, gf: 11, ga: 7, xg: 2.0, conf: "Balanced, peaks in knockouts", trend: 0 },
  { code: "BEL", name: "Belgium", color: "#E30613", elo: 1978, fifa: 8, group: "B", titleProb: 3.8, top4: 16, advance: 86, form: ["W", "D", "D", "W", "L"] as const, gf: 9, ga: 6, xg: 1.8, conf: "Transitional squad, still dangerous", trend: -1 },
  { code: "CRO", name: "Croatia", color: "#C8102E", elo: 1955, fifa: 10, group: "E", titleProb: 2.6, top4: 12, advance: 80, form: ["D", "W", "L", "W", "D"] as const, gf: 8, ga: 6, xg: 1.6, conf: "Tournament pedigree, ageing core", trend: -1 },
  { code: "ITA", name: "Italy", color: "#1B458F", elo: 1948, fifa: 11, group: "G", titleProb: 2.4, top4: 11, advance: 78, form: ["W", "W", "D", "D", "W"] as const, gf: 9, ga: 4, xg: 1.7, conf: "Defensively elite again", trend: 1 },
  { code: "URU", name: "Uruguay", color: "#5CBFEB", elo: 1932, fifa: 13, group: "F", titleProb: 2.1, top4: 10, advance: 76, form: ["W", "L", "W", "D", "W"] as const, gf: 10, ga: 7, xg: 1.8, conf: "Aggressive, well-coached", trend: 1 },
  { code: "USA", name: "USA", color: "#0A3161", elo: 1842, fifa: 14, group: "D", titleProb: 1.9, top4: 9, advance: 82, host: true, form: ["W", "W", "D", "W", "L"] as const, gf: 9, ga: 6, xg: 1.6, conf: "Host energy + young core", trend: 1 },
  { code: "MEX", name: "Mexico", color: "#006847", elo: 1799, fifa: 16, group: "A", titleProb: 1.4, top4: 7, advance: 79, host: true, form: ["W", "D", "W", "L", "W"] as const, gf: 8, ga: 6, xg: 1.5, conf: "Home crowds, attacking verve", trend: 0 },
  { code: "MAR", name: "Morocco", color: "#C1272D", elo: 1864, fifa: 12, group: "C", titleProb: 2.0, top4: 9, advance: 81, form: ["W", "W", "D", "W", "D"] as const, gf: 8, ga: 3, xg: 1.6, conf: "Semifinalist DNA, rock-solid", trend: 1 },
  { code: "CAN", name: "Canada", color: "#D52B1E", elo: 1746, fifa: 24, group: "B", titleProb: 0.7, top4: 4, advance: 64, host: true, form: ["L", "W", "D", "W", "L"] as const, gf: 7, ga: 7, xg: 1.4, conf: "Pace on the break, host boost", trend: 0 },
  { code: "COL", name: "Colombia", color: "#FCD116", txt: "#0E1422", elo: 1908, fifa: 15, group: "H", titleProb: 1.6, top4: 8, advance: 77, form: ["W", "D", "W", "W", "D"] as const, gf: 10, ga: 5, xg: 1.8, conf: "Creative, unbeaten run", trend: 1 },
  { code: "JPN", name: "Japan", color: "#1B3FA0", elo: 1879, fifa: 17, group: "G", titleProb: 1.2, top4: 6, advance: 74, form: ["W", "W", "W", "D", "L"] as const, gf: 11, ga: 5, xg: 1.7, conf: "Quick, fearless, organised", trend: 1 },
].map((t) => ({ ...t, form: [...t.form] }));

const matches = [
  {
    id: "m1", time: "13:00", venue: "Estadio Azteca · Mexico City", stage: "Group A · MD2",
    home: "MEX", away: "URU", awayCode: "URU", pick: "URU", pickKind: "win" as const,
    score: [1, 2] as [number, number], conf: 58, winH: 33, draw: 27, winA: 40,
    reasons: ["Uruguay's press disrupts Mexico's build-up", "Altitude tempered by Uruguay's fitness base", "Edge in xG over last 6 (1.9 vs 1.4)"],
    risk: "Home crowd at the Azteca can spark an early Mexico goal and flip momentum.",
    tag: "Upset watch",
  },
  {
    id: "m2", time: "16:00", venue: "MetLife Stadium · New Jersey", stage: "Group F · MD2",
    home: "FRA", away: "CRO", awayCode: "CRO", pick: "FRA", pickKind: "win" as const,
    score: [2, 0] as [number, number], conf: 71, winH: 64, draw: 22, winA: 14,
    reasons: ["France pace overwhelms Croatia's high line", "Croatia midfield legs fading in tournament", "France clean-sheet rate 60% in 2026 cycle"],
    risk: "If France rest starters early, Croatia's experience can grind out a draw.",
    tag: "High confidence",
  },
  {
    id: "m3", time: "19:00", venue: "SoFi Stadium · Los Angeles", stage: "Group D · MD2",
    home: "USA", away: "GER", awayCode: "GER", pick: "DRAW", pickKind: "draw" as const,
    score: [1, 1] as [number, number], conf: 49, winH: 30, draw: 38, winA: 32,
    reasons: ["Home crowd lifts USA pressing intensity", "Germany rotating ahead of knockout push", "Tight xG margin, both defences solid"],
    risk: "A single set-piece could decide it either way — low-confidence call.",
    tag: "Coin flip",
  },
  {
    id: "m4", time: "21:30", venue: "Mercedes-Benz Stadium · Atlanta", stage: "Group C · MD2",
    home: "ENG", away: "MAR", awayCode: "MAR", pick: "ENG", pickKind: "win" as const,
    score: [2, 1] as [number, number], conf: 61, winH: 55, draw: 26, winA: 19,
    reasons: ["England depth wins late-game phases", "Morocco's block is hard to break early", "Set-piece edge to England (3 of last 5 goals)"],
    risk: "Morocco's low block + counters have troubled England before.",
    tag: "Lean",
  },
  {
    id: "m5", time: "22:00", venue: "BC Place · Vancouver", stage: "Group B · MD2",
    home: "CAN", away: "NED", awayCode: "NED", pick: "NED", pickKind: "win" as const,
    score: [0, 2] as [number, number], conf: 67, winH: 17, draw: 23, winA: 60,
    reasons: ["Netherlands control + finishing quality", "Canada misses suspended CB (see alerts)", "NED xG 2.0 vs CAN xGA 1.7"],
    risk: "Canada's pace on the break at home can punish a high Dutch line.",
    tag: "High confidence",
  },
];

const scorers = [
  { player: "Kylian Mbappé", team: "FRA", pos: "FWD", proj: 7.2, prob: 19, goals: 3, g90: 0.92, pens: true, minutes: 92, conf: 82, trend: 1, note: "Penalty taker, deep tournament run projected", projectedMatches: 7, groupDifficulty: 0.94, injuryRisk: "Low" },
  { player: "Harry Kane", team: "ENG", pos: "FWD", proj: 6.6, prob: 16, goals: 3, g90: 0.88, pens: true, minutes: 90, conf: 79, trend: 1, note: "Pens + open play, England favoured to go far", projectedMatches: 7, groupDifficulty: 0.96, injuryRisk: "Low" },
  { player: "Lautaro Martínez", team: "ARG", pos: "FWD", proj: 6.1, prob: 13, goals: 2, g90: 0.81, pens: false, minutes: 84, conf: 74, trend: 0, note: "Elite finisher on champions' projected run", projectedMatches: 7, groupDifficulty: 0.95, injuryRisk: "Low" },
  { player: "Lamine Yamal", team: "ESP", pos: "FWD", proj: 5.4, prob: 11, goals: 2, g90: 0.69, pens: false, minutes: 88, conf: 71, trend: 1, note: "Volume creator, finishing rising sharply", projectedMatches: 7, groupDifficulty: 0.93, injuryRisk: "Low" },
  { player: "Vinícius Júnior", team: "BRA", pos: "FWD", proj: 5.1, prob: 9, goals: 2, g90: 0.66, pens: false, minutes: 86, conf: 68, trend: -1, note: "High xG but Brazil exit risk in QF", projectedMatches: 5, groupDifficulty: 0.97, injuryRisk: "Medium" },
  { player: "Julián Álvarez", team: "ARG", pos: "FWD", proj: 4.7, prob: 7, goals: 1, g90: 0.62, pens: false, minutes: 78, conf: 64, trend: 0, note: "Shares minutes, secondary pen option", projectedMatches: 7, groupDifficulty: 0.95, injuryRisk: "Low" },
  { player: "Rafael Leão", team: "POR", pos: "FWD", proj: 4.0, prob: 5, goals: 1, g90: 0.55, pens: false, minutes: 80, conf: 58, trend: 1, note: "Breakout form, Portugal deep run plausible", projectedMatches: 6, groupDifficulty: 0.96, injuryRisk: "Low" },
  { player: "Cody Gakpo", team: "NED", pos: "FWD", proj: 3.6, prob: 4, goals: 1, g90: 0.58, pens: false, minutes: 82, conf: 55, trend: 0, note: "Versatile, on penalties for Netherlands", projectedMatches: 6, groupDifficulty: 0.94, injuryRisk: "Low" },
];

const news = [
  { type: "injury" as const, sev: "high" as const, team: "BRA", title: "Brazil CB Marquinhos doubtful (calf)", time: "32m ago", impact: "−1.4% title prob", body: "Late fitness test ahead of Group G opener. Backup pairing lowers defensive ceiling.", icon: "cross" },
  { type: "suspension" as const, sev: "high" as const, team: "CAN", title: "Canada lose starting CB to suspension", time: "1h ago", impact: "CAN win prob −9%", body: "Yellow-card accumulation rules out first-choice centre-back vs Netherlands tonight.", icon: "card" },
  { type: "lineup" as const, sev: "med" as const, team: "FRA", title: "France rotate: Mbappé rested 2nd half expected", time: "2h ago", impact: "Top-scorer model unchanged", body: "Coach signals minutes management with qualification near-secured.", icon: "rotate" },
  { type: "injury" as const, sev: "med" as const, team: "ESP", title: "Spain midfielder returns to full training", time: "3h ago", impact: "+0.6% title prob", body: "Pedri completes full session, available for selection in Group E.", icon: "check" },
  { type: "news" as const, sev: "low" as const, team: "USA", title: "Record crowd expected at SoFi tonight", time: "5h ago", impact: "Host edge +2% win prob", body: "Sell-out atmosphere factored into USA home-advantage modifier.", icon: "info" },
  { type: "odds" as const, sev: "low" as const, team: "GER", title: "Germany odds shorten after strong MD1", time: "6h ago", impact: "Market −0.4 to title", body: "Public money moving toward Germany following convincing opener.", icon: "trend" },
];

const userPicks = {
  points: 1480,
  rank: 312,
  totalUsers: 48910,
  accuracy: 64,
  streak: 4,
  top4: [
    { pos: 1, team: "ARG", status: "on-track" as const, note: "Jack's pick — reigning champions" },
    { pos: 2, team: "ESP", status: "on-track" as const, note: "Jack's pick — best ball progression" },
    { pos: 3, team: "FRA", status: "on-track" as const, note: "Jack's pick — elite transition attack" },
    { pos: 4, team: "BRA", status: "on-track" as const, note: "Jack's pick — individual quality" },
  ],
  topScorer: { player: "Kylian Mbappé", team: "FRA", status: "leading" as const, note: "3 goals — joint top so far" },
  history: [
    { match: "ARG 3–1 KSA", pick: "ARG Win", aiPick: "ARG Win", result: "hit" as const, pts: 30, score: "2–1 (close)" },
    { match: "FRA 2–0 CRO", pick: "FRA Win", aiPick: "FRA Win", result: "hit" as const, pts: 50, score: "exact score" },
    { match: "BRA 1–2 MAR", pick: "BRA Win", aiPick: "BRA Win", result: "miss" as const, pts: 0, score: "upset" },
    { match: "ESP 4–1 JPN", pick: "ESP Win", aiPick: "ESP Win", result: "hit" as const, pts: 30, score: "winner only" },
    { match: "GER 1–1 USA", pick: "GER Win", aiPick: "DRAW", result: "miss" as const, pts: 0, score: "draw" },
    { match: "POR 2–0 KOR", pick: "POR Win", aiPick: "POR Win", result: "hit" as const, pts: 30, score: "winner only" },
  ],
  accuracyTrend: [48, 52, 50, 58, 61, 60, 64],
};

const modelWeights = [
  { factor: "Team Strength / Elo", weight: 25, color: "var(--accent)" },
  { factor: "Recent Form", weight: 20, color: "var(--accent-3)" },
  { factor: "Attack & Defense", weight: 20, color: "#9B7BFF" },
  { factor: "Injuries & Suspensions", weight: 15, color: "var(--accent-2)" },
  { factor: "Tournament Context", weight: 10, color: "var(--accent-warm)" },
  { factor: "Public Odds / Sentiment", weight: 5, color: "#5CBFEB" },
  { factor: "AI News Analysis", weight: 5, color: "#38E08A" },
];

const meta = {
  tournament: "FIFA World Cup 2026",
  hosts: "USA · Canada · Mexico",
  kickoff: "2026-06-11T19:00:00.000Z",
  simRuns: 10000,
  lastUpdate: "7:02 AM",
  nextRefresh: "4:00 PM",
  matchesToday: 5,
};

function buildSeedData(): WorldCupData {
  const teamMap: Record<string, (typeof teams)[number]> = {};
  teams.forEach((t) => { teamMap[t.code] = t; });
  return {
    teams: teams as WorldCupData["teams"],
    teamMap: teamMap as WorldCupData["teamMap"],
    matches,
    scorers,
    news,
    userPicks,
    modelWeights,
    meta,
  };
}

export const SEED_DATA = buildSeedData();
