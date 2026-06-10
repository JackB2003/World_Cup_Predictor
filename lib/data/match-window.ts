import type { Match } from "@/types/world-cup";

type KickoffRecord = { kickoffAt?: string };

/** Matches in the next 36-hour window (covers US timezone offsets vs UTC). */
export function selectUpcomingWindow<T extends KickoffRecord>(matches: T[]): T[] {
  const now = Date.now();
  const windowEnd = now + 36 * 3600 * 1000;
  return matches.filter((m) => {
    if (!m.kickoffAt) return false;
    const ko = new Date(m.kickoffAt).getTime();
    return ko >= now - 3 * 3600 * 1000 && ko <= windowEnd;
  });
}

/** Window matches, or the next five future matches when the window is empty. */
export function selectDisplayMatches(matches: Match[]): Match[] {
  const upcoming = selectUpcomingWindow(matches);
  if (upcoming.length > 0) return upcoming;
  return matches
    .filter((m) => m.kickoffAt && new Date(m.kickoffAt) > new Date())
    .slice(0, 5);
}
