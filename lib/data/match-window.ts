import type { Match } from "@/types/world-cup";
import { chicagoDateStr } from "@/lib/utils";

type KickoffRecord = { kickoffAt?: string };

/**
 * Matches whose kickoff falls on the current calendar day in US Central time
 * (America/Chicago). Kickoffs are stored in UTC; the server runs in UTC, so we
 * must compare calendar dates in Central — NOT a rolling clock window — or
 * tomorrow's fixtures leak into "today". This is timezone-safe and DST-safe.
 */
export function selectTodayMatches<T extends KickoffRecord>(matches: T[]): T[] {
  const today = chicagoDateStr(new Date());
  return matches.filter((m) => {
    if (!m.kickoffAt) return false;
    return chicagoDateStr(new Date(m.kickoffAt)) === today;
  });
}

/**
 * Matches in the next 36-hour window (covers US timezone offsets vs UTC).
 * Used by the prediction script, which deliberately needs a wider, forward-
 * looking window so overnight/early fixtures are predicted ahead of kickoff.
 * Do NOT use this for the "matches today" overview count or display list —
 * use selectTodayMatches instead.
 */
export function selectUpcomingWindow<T extends KickoffRecord>(matches: T[]): T[] {
  const now = Date.now();
  const windowEnd = now + 36 * 3600 * 1000;
  return matches.filter((m) => {
    if (!m.kickoffAt) return false;
    const ko = new Date(m.kickoffAt).getTime();
    return ko >= now - 3 * 3600 * 1000 && ko <= windowEnd;
  });
}

/** Today's matches (Central calendar day), or the next five future matches when today has none. */
export function selectDisplayMatches(matches: Match[]): Match[] {
  const todayMatches = selectTodayMatches(matches);
  if (todayMatches.length > 0) return todayMatches;
  return matches
    .filter((m) => m.kickoffAt && new Date(m.kickoffAt) > new Date())
    .slice(0, 5);
}
