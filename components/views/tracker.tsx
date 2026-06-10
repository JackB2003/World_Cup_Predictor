"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DailyPick, WorldCupData } from "@/types/world-cup";
import { fetchDailyPicks } from "@/lib/picks/client";
import { isPickLocked } from "@/features/picks/daily-picks";
import { DailyPicksSection } from "@/components/views/tracker/daily-picks-section";
import { PerformanceStats } from "@/components/views/tracker/performance-stats";
import { SeasonLongSection } from "@/components/views/tracker/season-long-section";

export function TrackerView({ data }: { data: WorldCupData }) {
  const u = data.userPicks;
  const [pendingPicks, setPendingPicks] = useState<DailyPick[]>([]);

  const hits = u.history.filter((h) => h.result === "hit").length;
  const misses = u.history.filter((h) => h.result === "miss").length;

  const upcomingMatches = useMemo(
    () => data.matches.filter((m) => !isPickLocked(m.kickoffAt)),
    [data.matches],
  );

  const loadPending = useCallback(async () => {
    const ids = upcomingMatches.map((m) => m.id);
    if (!ids.length) {
      setPendingPicks([]);
      return;
    }
    const { picks } = await fetchDailyPicks(ids);
    setPendingPicks(picks);
  }, [upcomingMatches]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const pendingByMatch = useMemo(() => {
    const map: Record<string, DailyPick> = {};
    for (const p of pendingPicks) map[p.matchId] = p;
    return map;
  }, [pendingPicks]);

  return (
    <div className="fade-in grid gap-[18px]">
      <PerformanceStats accuracy={u.accuracy} streak={u.streak} hits={hits} misses={misses} />

      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <DailyPicksSection
          accuracy={u.accuracy}
          accuracyTrend={u.accuracyTrend}
          upcomingMatches={upcomingMatches}
          pendingByMatch={pendingByMatch}
          teamMap={data.teamMap}
          history={u.history}
        />

        <div className="grid gap-[18px] content-start">
          <SeasonLongSection
            top4={u.top4}
            topScorer={u.topScorer}
            teamMap={data.teamMap}
            scorers={data.scorers}
          />
        </div>
      </div>
    </div>
  );
}
