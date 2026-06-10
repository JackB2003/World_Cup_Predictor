import { formScore } from "@/features/team-strength";
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

function injuryImpact(news: NewsItem[], teamCode: string): number {
  return news
    .filter((n) => n.team === teamCode && (n.type === "injury" || n.type === "suspension"))
    .reduce((acc, n) => acc + (n.sev === "high" ? 0.12 : n.sev === "med" ? 0.06 : 0.02), 0);
}

function teamPower(team: Team, news: NewsItem[]): number {
  const base = team.elo / 2200;
  const form = formScore(team.form);
  const attack = team.xg / 3;
  const defense = 1 - team.ga / 20;
  const host = team.host ? 0.06 : 0;
  const injuries = injuryImpact(news, team.code);
  return base * 0.35 + form * 0.25 + attack * 0.2 + defense * 0.15 + host - injuries;
}

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
  const homePower = teamPower(home, news);
  const awayPower = teamPower(away, news);
  const drawBias = 0.24;
  const total = homePower + awayPower + drawBias;
  const winH = Math.round((homePower / total) * 100);
  const winA = Math.round((awayPower / total) * 100);
  const draw = Math.max(0, 100 - winH - winA);

  let pickKind: "win" | "draw" = "win";
  let pick = home.code;
  let conf = winH;

  if (draw > winH && draw > winA) {
    pickKind = "draw";
    pick = "DRAW";
    conf = draw;
  } else if (winA > winH) {
    pick = away.code;
    conf = winA;
  }

  const spread = Math.abs(winH - winA);
  const tag = confidenceTag(conf, spread);

  const homeGoals = Math.max(0, Math.round(homePower * 2.2));
  const awayGoals = Math.max(0, Math.round(awayPower * 2.2));
  const score: [number, number] =
    pickKind === "draw"
      ? [Math.min(homeGoals, awayGoals), Math.min(homeGoals, awayGoals)]
      : pick === home.code
        ? [Math.max(homeGoals, awayGoals + 1), awayGoals]
        : [homeGoals, Math.max(awayGoals, homeGoals + 1)];

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
