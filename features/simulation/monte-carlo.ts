import { formScore } from "@/features/team-strength";
import type { Team } from "@/types/world-cup";

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

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function teamStrength(team: Team, injuryPenalty = 0): number {
  const eloNorm = team.elo / 2200;
  const form = formScore(team.form);
  const attack = team.xg / 3;
  const defense = 1 - team.ga / 20;
  const hostBoost = team.host ? 0.05 : 0;
  return eloNorm * 0.25 + form * 0.2 + attack * 0.1 + defense * 0.1 + hostBoost - injuryPenalty;
}

function simulateMatch(home: Team, away: Team, rng: () => number): "home" | "away" | "draw" {
  const homeStr = teamStrength(home) + 0.04;
  const awayStr = teamStrength(away);
  const drawBias = 0.22;
  const homeWin = homeStr / (homeStr + awayStr + drawBias);
  const awayWin = awayStr / (homeStr + awayStr + drawBias);
  const r = rng();
  if (r < homeWin) return "home";
  if (r < homeWin + awayWin) return "away";
  return "draw";
}

function groupTeams(teams: Team[]): Record<string, Team[]> {
  const groups: Record<string, Team[]> = {};
  for (const t of teams) {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  }
  return groups;
}

function simulateGroupStandings(group: Team[], rng: () => number): Team[] {
  const points: Record<string, number> = {};
  const gd: Record<string, number> = {};
  group.forEach((t) => { points[t.code] = 0; gd[t.code] = 0; });

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const home = group[i];
      const away = group[j];
      const result = simulateMatch(home, away, rng);
      if (result === "home") {
        points[home.code] += 3;
        gd[home.code] += 1;
        gd[away.code] -= 1;
      } else if (result === "away") {
        points[away.code] += 3;
        gd[away.code] += 1;
        gd[home.code] -= 1;
      } else {
        points[home.code] += 1;
        points[away.code] += 1;
      }
    }
  }

  return [...group].sort((a, b) => {
    if (points[b.code] !== points[a.code]) return points[b.code] - points[a.code];
    return gd[b.code] - gd[a.code];
  });
}

function knockoutWinner(a: Team, b: Team, rng: () => number): Team {
  const result = simulateMatch(a, b, rng);
  if (result === "home") return a;
  if (result === "away") return b;
  return teamStrength(a) >= teamStrength(b) ? a : b;
}

function advanceKnockoutRound(bracket: Team[], rng: () => number): Team[] {
  const next: Team[] = [];
  for (let i = 0; i < bracket.length; i += 2) {
    if (i + 1 < bracket.length) {
      next.push(knockoutWinner(bracket[i], bracket[i + 1], rng));
    } else {
      next.push(bracket[i]);
    }
  }
  return next;
}

function runKnockoutBracket(qualifiers: Team[], rng: () => number): Team[] {
  let bracket = [...qualifiers];
  const finalists: Team[] = [];

  while (bracket.length > 1) {
    bracket = advanceKnockoutRound(bracket, rng);
    if (bracket.length === 4) finalists.push(...bracket);
  }

  return bracket.length ? [bracket[0], ...finalists.slice(0, 3)] : finalists;
}

export function runMonteCarlo(teams: Team[], simRuns = 10000, seed = 42): MonteCarloOutput {
  const rng = seededRandom(seed);
  const stats: Record<string, { titles: number; top4: number; advance: number; finishSum: number }> = {};

  teams.forEach((t) => {
    stats[t.code] = { titles: 0, top4: 0, advance: 0, finishSum: 0 };
  });

  const groups = groupTeams(teams);

  for (let run = 0; run < simRuns; run++) {
    const qualifiers: Team[] = [];
    Object.values(groups).forEach((g) => {
      const sorted = simulateGroupStandings(g, rng);
      sorted.slice(0, 2).forEach((t) => qualifiers.push(t));
    });

    qualifiers.forEach((t) => { stats[t.code].advance += 1; });

    const shuffled = [...qualifiers].sort(() => rng() - 0.5);
    const results = runKnockoutBracket(shuffled, rng);

    if (results[0]) stats[results[0].code].titles += 1;

    const semiFinalists = shuffled.length >= 8
      ? runSemiFinalists(shuffled, rng)
      : results.slice(0, 4);

    semiFinalists.slice(0, 4).forEach((t, i) => {
      stats[t.code].top4 += 1;
      stats[t.code].finishSum += i + 1;
    });
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

function runSemiFinalists(qualifiers: Team[], rng: () => number): Team[] {
  let bracket = [...qualifiers];
  while (bracket.length > 4) {
    bracket = advanceKnockoutRound(bracket, rng);
  }
  return bracket;
}
