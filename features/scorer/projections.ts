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

export function rankScorers(scorers: Scorer[], teams: Team[]): ScorerProjection[] {
  const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));

  const projected = scorers.map((s) => {
    const team = teamMap[s.team];
    const totalExpectedMatches = team ? expectedMatches(team) : (s.projectedMatches ?? 5);
    const gamesPlayed = s.gamesPlayed ?? 0;
    const remainingMatches = Math.max(0, totalExpectedMatches - gamesPlayed);

    const grpDiff = team ? groupDifficulty(team, teams) : (s.groupDifficulty ?? 0.95);
    const minutesRatio = (s.minutes ?? 80) / 90;
    const g90 = s.g90 ?? 0.5;

    // Projected remaining goals using historical rate (actual goals are already banked)
    const remainingGoals =
      remainingMatches *
      minutesRatio *
      g90 *
      penaltyBonus(s.pens) *
      grpDiff *
      injuryModifier(s.injuryRisk);

    const actualGoals = s.goals ?? 0;
    const projTotal = actualGoals + remainingGoals;

    const projectedMatchesCalc = team
      ? Math.round(totalExpectedMatches * 10) / 10
      : (s.projectedMatches ?? 5);
    const groupDiffCalc = team
      ? Math.round(grpDiff * 1000) / 1000
      : (s.groupDifficulty ?? 0.95);

    return {
      ...s,
      score: projTotal,
      proj: Math.round(projTotal * 10) / 10,
      projectedMatches: projectedMatchesCalc,
      groupDifficulty: groupDiffCalc,
    };
  });

  const total = projected.reduce((sum, s) => sum + s.score, 0) || 1;

  return projected
    .map((s) => ({ ...s, prob: Math.round((s.score / total) * 1000) / 10 }))
    .sort((a, b) => {
      // Primary: current goals DESC (live tournament ranking)
      const goalsDiff = (b.goals ?? 0) - (a.goals ?? 0);
      if (goalsDiff !== 0) return goalsDiff;
      // Tiebreak: projected total DESC
      return b.score - a.score;
    });
}
