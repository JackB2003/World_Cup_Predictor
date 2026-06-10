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

function groupModifier(difficulty?: number): number {
  return difficulty ?? 0.95;
}

function computeScorerScore(scorer: Scorer, team?: Team): number {
  const matches = scorer.projectedMatches ?? (team ? Math.round(team.advance / 14) : 5);
  const minutes = (scorer.minutes ?? 80) / 90;
  const g90 = scorer.g90 ?? 0.5;
  return (
    matches *
    minutes *
    g90 *
    penaltyBonus(scorer.pens) *
    groupModifier(scorer.groupDifficulty) *
    injuryModifier(scorer.injuryRisk)
  );
}

export function rankScorers(scorers: Scorer[], teams: Team[]): ScorerProjection[] {
  const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));
  const projected = scorers.map((s) => {
    const score = computeScorerScore(s, teamMap[s.team]);
    return {
      ...s,
      score,
      proj: Math.round(score * 10) / 10,
    };
  });

  const total = projected.reduce((sum, s) => sum + s.score, 0) || 1;
  return projected
    .map((s) => ({ ...s, prob: Math.round((s.score / total) * 1000) / 10 }))
    .sort((a, b) => b.score - a.score);
}
