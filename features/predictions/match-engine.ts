import { formScore } from "@/features/team-strength";
import { poissonMatchPrediction } from "@/features/predictions/score-model";
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
): MatchPrediction {
  const poisson = poissonMatchPrediction(home, away, news);
  const { winH, draw, winA, outcome, score } = poisson;

  const pickKind: "win" | "draw" = outcome === "draw" ? "draw" : "win";
  const pick =
    outcome === "draw" ? "DRAW" : outcome === "home" ? home.code : away.code;
  const conf =
    outcome === "draw" ? draw : outcome === "home" ? winH : winA;

  const spread = Math.abs(winH - winA);
  const tag = confidenceTag(conf, spread);

  const reasons = [
    `${home.name} Elo ${home.elo} vs ${away.name} ${away.elo}`,
    `Form edge: ${home.name} ${(formScore(home.form) * 100).toFixed(0)}% vs ${(formScore(away.form) * 100).toFixed(0)}%`,
    `xG differential ${(home.xg - away.xg).toFixed(1)} over recent matches`,
  ];

  const risk =
    spread < 10
      ? "Tight margins — a single moment could flip this pick."
      : pickKind === "draw"
        ? "Late goals or red cards often break deadlocks in knockout tension."
        : `${pick === home.code ? away.name : home.name} counters well on transitions.`;

  return { pick, pickKind, score, conf, winH, draw, winA, tag, reasons, risk };
}
