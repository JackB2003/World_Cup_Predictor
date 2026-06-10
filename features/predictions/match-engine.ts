import {
  injuryImpact,
  poissonMatchPrediction,
  type H2HRecord,
  type MarketOdds,
  type TournamentStats,
} from "@/features/predictions/score-model";
import type { Team, NewsItem } from "@/types/world-cup";

export type MatchPrediction = {
  pick: string;
  pickKind: "win" | "draw";
  score: [number, number];
  conf: number;
  winH: number;
  draw: number;
  winA: number;
  tag: string;
  reasons: string[];
  risk: string;
};

export type MatchContext = {
  marketOdds?: MarketOdds;
  restDaysHome?: number;
  restDaysAway?: number;
  tournamentStatsHome?: TournamentStats;
  tournamentStatsAway?: TournamentStats;
  h2h?: H2HRecord;
};

function confidenceTag(conf: number, spread: number): string {
  if (conf >= 65) return "High confidence";
  if (spread < 8) return "Coin flip";
  if (conf < 55) return "Upset watch";
  return "Lean";
}

export function predictMatch(
  home: Team,
  away: Team,
  news: NewsItem[] = [],
  context: MatchContext = {},
): MatchPrediction {
  const poisson = poissonMatchPrediction(home, away, news, {
    marketOdds: context.marketOdds,
    restDaysHome: context.restDaysHome,
    restDaysAway: context.restDaysAway,
    tournamentStatsHome: context.tournamentStatsHome,
    tournamentStatsAway: context.tournamentStatsAway,
    h2h: context.h2h,
  });
  const { winH, draw, winA, outcome, score } = poisson;

  const pickKind: "win" | "draw" = outcome === "draw" ? "draw" : "win";
  const pick =
    outcome === "draw" ? "DRAW" : outcome === "home" ? home.code : away.code;
  const conf =
    outcome === "draw" ? draw : outcome === "home" ? winH : winA;

  const spread = Math.abs(winH - winA);
  const tag = confidenceTag(conf, spread);

  const reasons: string[] = [];

  if (Math.abs(home.elo - away.elo) > 50) {
    reasons.push(
      `${home.elo > away.elo ? home.name : away.name} Elo advantage: ${Math.abs(home.elo - away.elo)} points`,
    );
  }

  if (context.marketOdds) {
    reasons.push(
      `Market implies ${pick === home.code ? Math.round(context.marketOdds.home * 100) : Math.round(context.marketOdds.away * 100)}% for ${pick}`,
    );
  }

  const homeInjury = injuryImpact(news, home.code);
  const awayInjury = injuryImpact(news, away.code);
  if (homeInjury > 0.05) {
    reasons.push(`${home.name} injury/suspension concern (-${Math.round(homeInjury * 100)}% attack)`);
  }
  if (awayInjury > 0.05) {
    reasons.push(`${away.name} injury/suspension concern (-${Math.round(awayInjury * 100)}% attack)`);
  }

  if (context.restDaysHome && context.restDaysHome < 4) {
    reasons.push(`${home.name} on short rest (${context.restDaysHome} days)`);
  }
  if (context.restDaysAway && context.restDaysAway < 4) {
    reasons.push(`${away.name} on short rest (${context.restDaysAway} days)`);
  }

  if (context.h2h && context.h2h.total >= 5) {
    const dominant = context.h2h.homeWins > context.h2h.awayWins ? home.name : away.name;
    reasons.push(
      `${dominant} leads H2H (${Math.max(context.h2h.homeWins, context.h2h.awayWins)}/${context.h2h.total} wins)`,
    );
  }

  while (reasons.length < 3) {
    reasons.push(
      `xG differential ${(home.xg - away.xg).toFixed(1)} favors ${home.xg >= away.xg ? home.name : away.name}`,
    );
  }
  reasons.splice(3);

  const risk =
    spread < 10
      ? "Tight margins — a single moment could flip this pick."
      : pickKind === "draw"
        ? "Late goals or red cards often break deadlocks in knockout tension."
        : `${pick === home.code ? away.name : home.name} counters well on transitions.`;

  return { pick, pickKind, score, conf, winH, draw, winA, tag, reasons, risk };
}
