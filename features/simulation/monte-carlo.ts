import { poissonMatchPrediction } from "@/features/predictions/score-model";
import type { Team } from "@/types/world-cup";

// Real 2026 WC group assignments derived from API-Football standings (by apiTeamId).
// Notes on code mismatches due to import artifacts:
//   AUT (apiId=1108) = Scotland in the real draw (Group C)
//   SUI (apiId=20)   = Australia in the real draw (Group D)
//   ALG (apiId=28)   = Tunisia in the real draw   (Group F)
//   TUN (apiId=1532) = Algeria in the real draw   (Group J)
//   SEN and PAN manually assigned to their real groups.
//   Groups B and J have 3 teams (4th not resolvable from PB data).
const GROUP_MAP: Record<string, string> = {
  // Group A
  MEX: "A", RSA: "A", KOR: "A", CZE: "A",
  // Group B (3 teams — Switzerland not in PB with correct apiId)
  CAN: "B", BIH: "B", QAT: "B",
  // Group C
  BRA: "C", MAR: "C", HAI: "C", AUT: "C",
  // Group D
  USA: "D", PAR: "D", SUI: "D", TUR: "D",
  // Group E
  GER: "E", CUW: "E", CIV: "E", ECU: "E",
  // Group F
  NED: "F", JPN: "F", SWE: "F", ALG: "F",
  // Group G
  BEL: "G", EGY: "G", IRN: "G", NZL: "G",
  // Group H
  ESP: "H", CPV: "H", KSA: "H", URU: "H",
  // Group I
  FRA: "I", IRQ: "I", NOR: "I", SEN: "I",
  // Group J (3 teams — Austria/id=775 not in PB under correct code)
  ARG: "J", TUN: "J", JOR: "J",
  // Group K
  POR: "K", COD: "K", UZB: "K", COL: "K",
  // Group L
  ENG: "L", CRO: "L", GHA: "L", PAN: "L",
};

export type SimulationResult = {
  teamCode: string;
  titleProb: number;
  top4Prob: number;
  advanceProb: number;
  avgFinish: number;
};

export type MonteCarloOutput = {
  results: SimulationResult[];
  simRuns: number;
  topFour: { position: number; teamCode: string; probability: number; reason: string }[];
};

type GroupResult = {
  standings: Team[];
  pts: Record<string, number>;
  gd: Record<string, number>;
  gf: Record<string, number>;
};

/** Apply host-nation advantage by temporarily boosting xG. Factor decays each knockout round. */
function withHostBoost(team: Team, factor: number): Team {
  if (!team.host || factor <= 0) return team;
  return { ...team, xg: team.xg * (1 + 0.15 * factor) };
}

/**
 * Group-stage match. Host nations are treated as "home" to receive the model's
 * home-advantage multiplier. Returns which team won ("a" | "b") or "draw".
 */
function groupMatch(a: Team, b: Team): "a" | "draw" | "b" {
  let home = a;
  let away = b;
  if (b.host && !a.host) { home = b; away = a; }

  const boostedHome = withHostBoost(home, 1.0);
  const { winH, draw, winA } = poissonMatchPrediction(boostedHome, away, []);
  const r = Math.random() * 100;

  const homeWon = r < winH;
  const awayWon = r >= winH + draw;
  if (!homeWon && !awayWon) return "draw";
  const homeWins = homeWon;
  return (home === a) ? (homeWins ? "a" : "b") : (homeWins ? "b" : "a");
}

/**
 * Knockout match. Draws resolved by simulated penalty shootout weighted by
 * relative Poisson win probability. hostBoostFactor decays from 1.0 (R32) to 0 (QF+).
 */
function knockoutMatch(a: Team, b: Team, hostBoostFactor: number): "a" | "b" {
  const aIsHost = !!a.host && !b.host;
  const bIsHost = !!b.host && !a.host;

  let home: Team;
  let away: Team;
  let flip = false;

  if (aIsHost) { home = withHostBoost(a, hostBoostFactor); away = b; }
  else if (bIsHost) { home = withHostBoost(b, hostBoostFactor); away = a; flip = true; }
  else { home = a; away = b; }

  const { winH, draw, winA } = poissonMatchPrediction(home, away, []);
  const r = Math.random() * 100;

  let homeWon: boolean;
  if (r < winH) {
    homeWon = true;
  } else if (r >= winH + draw) {
    homeWon = false;
  } else {
    // Penalty shootout: bias toward the stronger side
    const penFav = winH / Math.max(winH + winA, 1);
    homeWon = Math.random() < penFav;
  }

  if (flip) return homeWon ? "b" : "a";
  return homeWon ? "a" : "b";
}

function simulateGroup(group: Team[]): GroupResult {
  const pts: Record<string, number> = {};
  const gd: Record<string, number> = {};
  const gf: Record<string, number> = {};
  group.forEach((t) => { pts[t.code] = 0; gd[t.code] = 0; gf[t.code] = 0; });

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const result = groupMatch(group[i], group[j]);
      if (result === "a") {
        pts[group[i].code] += 3;
        gd[group[i].code] += 1; gd[group[j].code] -= 1;
        gf[group[i].code] += 1;
      } else if (result === "b") {
        pts[group[j].code] += 3;
        gd[group[j].code] += 1; gd[group[i].code] -= 1;
        gf[group[j].code] += 1;
      } else {
        pts[group[i].code] += 1;
        pts[group[j].code] += 1;
      }
    }
  }

  const standings = [...group].sort((a, b) => {
    if (pts[b.code] !== pts[a.code]) return pts[b.code] - pts[a.code];
    if (gd[b.code] !== gd[a.code]) return gd[b.code] - gd[a.code];
    return gf[b.code] - gf[a.code];
  });

  return { standings, pts, gd, gf };
}

/** Advance one knockout round. `round` controls host-boost decay (0=R32, 1=R16, 2+=no boost). */
function advanceRound(bracket: Team[], round: number): Team[] {
  const hostBoost = Math.max(0, 1 - round * 0.5);
  const next: Team[] = [];
  for (let i = 0; i < bracket.length; i += 2) {
    if (i + 1 >= bracket.length) { next.push(bracket[i]); continue; }
    const w = knockoutMatch(bracket[i], bracket[i + 1], hostBoost);
    next.push(w === "a" ? bracket[i] : bracket[i + 1]);
  }
  return next;
}

/**
 * Build a 32-team bracket from group winners, runners-up, and best-8 third-place.
 * Winners and runners-up are interleaved (winner[i] vs runner[i]) to avoid group rematches.
 * Each tier is independently shuffled so bracket composition varies each simulation run.
 */
function buildBracket(winners: Team[], runnersUp: Team[], thirdPlace: Team[]): Team[] {
  const w = [...winners].sort(() => Math.random() - 0.5);
  const r = [...runnersUp].sort(() => Math.random() - 0.5);
  const t = [...thirdPlace].sort(() => Math.random() - 0.5);

  const bracket: Team[] = [];
  for (let i = 0; i < Math.max(w.length, r.length); i++) {
    if (w[i]) bracket.push(w[i]);
    if (r[i]) bracket.push(r[i]);
  }
  bracket.push(...t);
  return bracket;
}

export function runMonteCarlo(teams: Team[], simRuns = 10000): MonteCarloOutput {
  const stats: Record<string, { titles: number; top4: number; advance: number; finishSum: number }> = {};
  teams.forEach((t) => { stats[t.code] = { titles: 0, top4: 0, advance: 0, finishSum: 0 }; });

  // Override group assignments with the real 2026 WC draw
  const teamsWithGroups = teams.map((t) => ({ ...t, group: GROUP_MAP[t.code] ?? "" }));

  // Partition teams into groups (skip teams not in the draw)
  const groupMap: Record<string, Team[]> = {};
  for (const t of teamsWithGroups) {
    if (t.group) {
      groupMap[t.group] = groupMap[t.group] ?? [];
      groupMap[t.group].push(t);
    }
  }

  for (let run = 0; run < simRuns; run++) {
    const winners: Team[] = [];
    const runnersUp: Team[] = [];
    const thirdCandidates: { team: Team; pts: number; gd: number; gf: number }[] = [];

    for (const group of Object.values(groupMap)) {
      const { standings, pts, gd, gf } = simulateGroup(group);

      if (standings[0]) winners.push(standings[0]);
      if (standings[1]) runnersUp.push(standings[1]);
      if (standings[2]) thirdCandidates.push({
        team: standings[2],
        pts: pts[standings[2].code],
        gd: gd[standings[2].code],
        gf: gf[standings[2].code],
      });
    }

    // Best 8 third-place finishers advance; top 2 from each group always advance
    const best8Third = thirdCandidates
      .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf)
      .slice(0, 8)
      .map((x) => x.team);

    winners.forEach((t) => { stats[t.code].advance += 1; });
    runnersUp.forEach((t) => { stats[t.code].advance += 1; });
    best8Third.forEach((t) => { stats[t.code].advance += 1; });

    // Build structured 32-team bracket
    const bracket = buildBracket(winners, runnersUp, best8Third);

    // Run knockout rounds: R32→R16→QF→SF→Final
    const r16 = advanceRound(bracket, 0);
    const qf = advanceRound(r16, 1);
    const sf = advanceRound(qf, 2);       // 4 semifinalists
    const finalists = advanceRound(sf, 3); // 2 finalists
    const champions = advanceRound(finalists, 4); // 1 champion

    // All 4 semifinalists count as top-4
    sf.forEach((t, i) => {
      if (stats[t.code]) {
        stats[t.code].top4 += 1;
        stats[t.code].finishSum += i + 1;
      }
    });

    if (champions[0] && stats[champions[0].code]) {
      stats[champions[0].code].titles += 1;
    }
  }

  const results: SimulationResult[] = teams.map((t) => ({
    teamCode: t.code,
    titleProb: Math.round((stats[t.code].titles / simRuns) * 1000) / 10,
    top4Prob: Math.round((stats[t.code].top4 / simRuns) * 1000) / 10,
    advanceProb: Math.round((stats[t.code].advance / simRuns) * 1000) / 10,
    avgFinish: stats[t.code].finishSum / Math.max(stats[t.code].top4, 1),
  }));

  const topTeams = [...results].sort((a, b) => b.titleProb - a.titleProb).slice(0, 4);
  const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));

  return {
    results: results.sort((a, b) => b.titleProb - a.titleProb),
    simRuns,
    topFour: topTeams.map((r, i) => ({
      position: i + 1,
      teamCode: r.teamCode,
      probability: r.top4Prob,
      reason: teamMap[r.teamCode]?.conf ?? "",
    })),
  };
}
