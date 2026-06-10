import { formScore } from "@/features/team-strength";
import type { Team, NewsItem } from "@/types/world-cup";

const LEAGUE_AVG_GA = 1.1;
const HOME_ADVANTAGE = 1.1;
const MAX_GOALS = 5;
/** Calibrates λ so typical match totals land around ~2.4–2.8 goals. */
const LAMBDA_SCALE = 0.88;

const MARKET_WEIGHT = 0.35;
const MODEL_WEIGHT = 0.65;

export type PoissonOutcome = "home" | "draw" | "away";

export type MarketOdds = { home: number; draw: number; away: number };
export type TournamentStats = { xgPerGame: number; gaPerGame: number; gamesPlayed: number };
export type H2HRecord = { homeWins: number; draws: number; awayWins: number; total: number };

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

/** Fatigue multiplier — optimal rest is 5+ days, scales down for shorter rest. */
function restPenalty(restDays?: number): number {
  if (!restDays || restDays >= 5) return 1.0;
  if (restDays === 4) return 0.97;
  if (restDays === 3) return 0.93;
  return 0.88; // 2 days or less
}

export function expectedLambda(
  attacker: Team,
  defender: Team,
  isHome: boolean,
  news: NewsItem[],
  restDays?: number,
  tournamentStats?: TournamentStats,
): number {
  let attackXg = Math.max(0.7, attacker.xg);

  // Blend in live tournament xG once the team has played in-tournament games.
  if (tournamentStats && tournamentStats.gamesPlayed >= 1) {
    const blendWeight = Math.min(0.7, tournamentStats.gamesPlayed * 0.25);
    attackXg = (1 - blendWeight) * attackXg + blendWeight * tournamentStats.xgPerGame;
  }

  const attack = Math.max(0.7, attackXg);
  const defenseFactor = gaPerGame(defender) / LEAGUE_AVG_GA;
  const eloMult = eloMultiplier(attacker, defender);
  const homeMult = isHome ? HOME_ADVANTAGE : 1;
  const formMult = 0.92 + formScore(attacker.form) * 0.16;
  const injuries = injuryImpact(news, attacker.code);
  const fatigueMult = restPenalty(restDays);

  let lambda = attack * defenseFactor * eloMult * homeMult * formMult * fatigueMult * LAMBDA_SCALE;
  lambda *= Math.max(0.5, 1 - injuries);
  return Math.min(4, Math.max(0.25, lambda));
}

export type PoissonOptions = {
  marketOdds?: MarketOdds;
  restDaysHome?: number;
  restDaysAway?: number;
  tournamentStatsHome?: TournamentStats;
  tournamentStatsAway?: TournamentStats;
  h2h?: H2HRecord;
};

export function poissonMatchPrediction(
  home: Team,
  away: Team,
  news: NewsItem[] = [],
  options: PoissonOptions = {},
): PoissonPrediction {
  const { marketOdds, restDaysHome, restDaysAway, tournamentStatsHome, tournamentStatsAway, h2h } = options;

  let lambdaHome = expectedLambda(home, away, true, news, restDaysHome, tournamentStatsHome);
  let lambdaAway = expectedLambda(away, home, false, news, restDaysAway, tournamentStatsAway);

  // Head-to-head adjustment — only with a meaningful sample.
  if (h2h && h2h.total >= 5) {
    const h2hHomeRate = h2h.homeWins / h2h.total;
    const h2hBias = (h2hHomeRate - 0.45) * 0.15; // centered at 45% home win rate, max ±7.5%
    lambdaHome *= 1 + h2hBias;
    lambdaAway *= 1 - h2hBias;
  }

  lambdaHome = Math.min(4, Math.max(0.25, lambdaHome));
  lambdaAway = Math.min(4, Math.max(0.25, lambdaAway));

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
  let winH = Math.round((pHome / total) * 100);
  let draw = Math.round((pDraw / total) * 100);
  let winA = Math.max(0, 100 - winH - draw);

  // Blend model probabilities with market-implied probabilities to de-bias.
  if (marketOdds) {
    winH = Math.round(MODEL_WEIGHT * winH + MARKET_WEIGHT * marketOdds.home * 100);
    draw = Math.round(MODEL_WEIGHT * draw + MARKET_WEIGHT * marketOdds.draw * 100);
    winA = Math.max(0, 100 - winH - draw);
  }

  // Determine outcome from the (possibly blended) probabilities.
  let outcome: PoissonOutcome = "home";
  let maxP = winH;
  if (draw > maxP) {
    outcome = "draw";
    maxP = draw;
  }
  if (winA > maxP) outcome = "away";

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
