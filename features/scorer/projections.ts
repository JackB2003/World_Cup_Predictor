import type { Scorer, Team } from "@/types/world-cup";

export type ScorerProjection = Scorer & {
  score: number;
};

function penaltyBonus(pens: boolean): number {
  return pens ? 1.15 : 1;
}

function injuryModifier(risk?: string): number {
  if (risk === "High") return 0.7;
  if (risk === "Medium") return 0.85;
  return 1;
}

/**
 * Expected total matches derived from Monte Carlo simulation results.
 * Formula: 3 group games + expected knockout games
 *   P(play R32)   = advance/100
 *   P(play R16)   ≈ advance/100 × 0.5
 *   P(play QF)    ≈ advance/100 × 0.25
 *   P(play SF)    = top4/100  (directly from simulation)
 *   P(play Final) ≈ top4/100 × 0.5
 * Combines to: 3 + adv×1.75 + top4×1.5
 */
function expectedMatches(team: Team): number {
  const adv = (team.advance ?? 0) / 100;
  const top4 = (team.top4 ?? 0) / 100;
  return 3 + adv * 1.75 + top4 * 1.5;
}

/**
 * Group difficulty modifier based on average opponent Elo in the team's real group.
 * Neutral (1.0) at avg-opponent Elo of 1650. Harder opponents → lower modifier.
 * Range: [0.88, 1.02].
 */
function groupDifficulty(team: Team, allTeams: Team[]): number {
  if (!team.group) return 0.95;
  const opponents = allTeams.filter((t) => t.group === team.group && t.code !== team.code);
  if (!opponents.length) return 0.95;
  const avgElo = opponents.reduce((s, t) => s + (t.elo ?? 1700), 0) / opponents.length;
  return Math.max(0.88, Math.min(1.02, 1.0 - (avgElo - 1650) * 0.0002));
}

function computeScorerScore(scorer: Scorer, team: Team | undefined, allTeams: Team[]): number {
  const matches = team ? expectedMatches(team) : (scorer.projectedMatches ?? 5);
  const grpDiff = team ? groupDifficulty(team, allTeams) : (scorer.groupDifficulty ?? 0.95);
  const minutes = (scorer.minutes ?? 80) / 90;
  const g90 = scorer.g90 ?? 0.5;
  return (
    matches *
    minutes *
    g90 *
    penaltyBonus(scorer.pens) *
    grpDiff *
    injuryModifier(scorer.injuryRisk)
  );
}

export function rankScorers(scorers: Scorer[], teams: Team[]): ScorerProjection[] {
  const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));
  const projected = scorers.map((s) => {
    const team = teamMap[s.team];
    const score = computeScorerScore(s, team, teams);
    const projectedMatchesCalc = team ? Math.round(expectedMatches(team) * 10) / 10 : (s.projectedMatches ?? 5);
    const groupDiffCalc = team ? Math.round(groupDifficulty(team, teams) * 1000) / 1000 : (s.groupDifficulty ?? 0.95);
    return {
      ...s,
      score,
      proj: Math.round(score * 10) / 10,
      projectedMatches: projectedMatchesCalc,
      groupDifficulty: groupDiffCalc,
    };
  });

  const total = projected.reduce((sum, s) => sum + s.score, 0) || 1;
  return projected
    .map((s) => ({ ...s, prob: Math.round((s.score / total) * 1000) / 10 }))
    .sort((a, b) => b.score - a.score);
}
