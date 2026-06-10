import type { DailyPickChoice } from "@/types/world-cup";

export type { DailyPickChoice };

export interface DailyPickRecord {
  matchId: string;
  choice: DailyPickChoice;
  pickTeam: string;
  pickLabel: string;
  kickoffAt: string;
  submittedAt: string;
  locked: boolean;
}

export function isPickLocked(kickoffAt: string | undefined): boolean {
  if (!kickoffAt) return false;
  return new Date(kickoffAt).getTime() <= Date.now();
}

export function resolvePick(
  choice: DailyPickChoice,
  homeCode: string,
  awayCode: string,
  teamNames: Record<string, string>,
): { pickTeam: string; pickLabel: string } {
  if (choice === "draw") {
    return { pickTeam: "DRAW", pickLabel: "Draw" };
  }
  const code = choice === "home" ? homeCode : awayCode;
  const name = teamNames[code] ?? code;
  return { pickTeam: code, pickLabel: `${name} Win` };
}

export function gradePick(
  pickTeam: string,
  homeCode: string,
  awayCode: string,
  scoreHome: number,
  scoreAway: number,
): boolean {
  if (scoreHome === scoreAway) return pickTeam === "DRAW";
  const winner = scoreHome > scoreAway ? homeCode : awayCode;
  return pickTeam === winner;
}

export function formatMatchLabel(
  homeCode: string,
  awayCode: string,
  scoreHome: number,
  scoreAway: number,
): string {
  return `${homeCode} ${scoreHome}–${scoreAway} ${awayCode}`;
}
