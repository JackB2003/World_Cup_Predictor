import { formScore } from "@/features/team-strength";
import type { Team, NewsItem } from "@/types/world-cup";

const LEAGUE_AVG_GA = 1.1;
const HOME_ADVANTAGE = 1.1;
const MAX_GOALS = 5;
/** Calibrates λ so typical match totals land around ~2.4–2.8 goals. */
const LAMBDA_SCALE = 0.88;

export type PoissonOutcome = "home" | "draw" | "away";

export type PoissonPrediction = {
  lambdaHome: number;
  lambdaAway: number;
  winH: number;
  draw: number;
  winA: number;
  outcome: PoissonOutcome;
  score: [number, number];
};

export function injuryImpact(news: NewsItem[], teamCode: string): number {
  return news
    .filter((n) => n.team === teamCode && (n.type === "injury" || n.type === "suspension"))
    .reduce((acc, n) => acc + (n.sev === "high" ? 0.12 : n.sev === "med" ? 0.06 : 0.02), 0);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function poissonPMF(k: number, lambda: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function estimatePlayed(team: Team): number {
  if (team.xg > 0 && team.gf > 0) {
    return Math.max(1, Math.round(team.gf / team.xg));
  }
  if (team.gf > 0 || team.ga > 0) {
    return Math.max(1, Math.round((team.gf + team.ga) / 2.5));
  }
  return 1;
}

function gaPerGame(team: Team): number {
  const played = estimatePlayed(team);
  if (team.ga <= 0) return LEAGUE_AVG_GA;
  return team.ga / played;
}

function eloMultiplier(attacker: Team, defender: Team): number {
  const diff = attacker.elo - defender.elo;
  return 1 + diff * 0.0005;
}

export function expectedLambda(
  attacker: Team,
  defender: Team,
  isHome: boolean,
  news: NewsItem[],
): number {
  const attack = Math.max(0.7, attacker.xg);
  const defenseFactor = gaPerGame(defender) / LEAGUE_AVG_GA;
  const eloMult = eloMultiplier(attacker, defender);
  const homeMult = isHome ? HOME_ADVANTAGE : 1;
  const formMult = 0.92 + formScore(attacker.form) * 0.16;
  const injuries = injuryImpact(news, attacker.code);

  let lambda = attack * defenseFactor * eloMult * homeMult * formMult * LAMBDA_SCALE;
  lambda *= Math.max(0.5, 1 - injuries);
  return Math.min(4, Math.max(0.25, lambda));
}

export function poissonMatchPrediction(
  home: Team,
  away: Team,
  news: NewsItem[] = [],
): PoissonPrediction {
  const lambdaHome = expectedLambda(home, away, true, news);
  const lambdaAway = expectedLambda(away, home, false, news);

  const grid: number[][] = [];
  let pHome = 0;
  let pDraw = 0;
  let pAway = 0;

  for (let h = 0; h <= MAX_GOALS; h++) {
    grid[h] = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonPMF(h, lambdaHome) * poissonPMF(a, lambdaAway);
      grid[h][a] = p;
      if (h > a) pHome += p;
      else if (h === a) pDraw += p;
      else pAway += p;
    }
  }

  const total = pHome + pDraw + pAway || 1;
  const winH = Math.round((pHome / total) * 100);
  const draw = Math.round((pDraw / total) * 100);
  const winA = Math.max(0, 100 - winH - draw);

  let outcome: PoissonOutcome = "home";
  let maxP = pHome;
  if (pDraw > maxP) {
    outcome = "draw";
    maxP = pDraw;
  }
  if (pAway > maxP) outcome = "away";

  let bestScore: [number, number] = [0, 0];
  let bestProb = -1;
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const matchesOutcome =
        (outcome === "home" && h > a) ||
        (outcome === "draw" && h === a) ||
        (outcome === "away" && a > h);
      if (matchesOutcome && grid[h][a] > bestProb) {
        bestProb = grid[h][a];
        bestScore = [h, a];
      }
    }
  }

  return { lambdaHome, lambdaAway, winH, draw, winA, outcome, score: bestScore };
}
