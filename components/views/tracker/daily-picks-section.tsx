"use client";

import Link from "next/link";
import { Clock, Footprints, Target } from "lucide-react";
import type { DailyPick, Match, Team, UserPicks } from "@/types/world-cup";
import { CardHead, Crest, Sparkline } from "@/components/ui/primitives";
import { basePath } from "@/lib/base-path";
import { ResultIcon } from "@/components/views/tracker/result-icon";

type DailyPicksSectionProps = {
  accuracy: number;
  accuracyTrend: number[];
  upcomingMatches: Match[];
  pendingByMatch: Record<string, DailyPick>;
  teamMap: Record<string, Team>;
  history: UserPicks["history"];
};

export function DailyPicksSection({
  accuracy,
  accuracyTrend,
  upcomingMatches,
  pendingByMatch,
  teamMap,
  history,
}: DailyPicksSectionProps) {
  return (
    <div className="grid gap-[18px] content-start">
      <div className="card p-5">
        <CardHead icon={<Footprints size={17} />} tag="Daily picks" title="Match Pick Performance" />
        <div className="flex items-end gap-4 mb-4">
          <div className="num text-[48px] text-[var(--accent)] leading-[0.9]">
            {accuracy}<span className="text-[22px]">%</span>
          </div>
          <div className="flex-1">
            <Sparkline data={accuracyTrend} w={220} h={56} />
          </div>
        </div>
        <div className="text-[var(--text-dim)] text-[12px]">
          Submit picks on{" "}
          <Link href={`${basePath}/picks`} className="text-[var(--accent)] font-semibold hover:underline">
            Today&apos;s Picks
          </Link>{" "}
          before kickoff. Unset picks stay blank.
        </div>
      </div>

      {upcomingMatches.length > 0 && (
        <div className="card p-5">
          <CardHead icon={<Clock size={17} />} tag="Pending" title="Today's Picks" />
          <div className="flex flex-col gap-2">
            {upcomingMatches.map((m) => {
              const pick = pendingByMatch[m.id];
              const home = teamMap[m.home];
              const away = teamMap[m.awayCode];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2.5 rounded-[11px] bg-[var(--surface-2)]"
                >
                  <Crest team={home} size={24} />
                  <span className="text-[var(--text-dim)] text-xs">vs</span>
                  <Crest team={away} size={24} />
                  <span className="font-semibold text-[13px] flex-1">
                    {home?.code} vs {away?.code}
                  </span>
                  {pick ? (
                    <span className="badge badge-good text-[10.5px]">{pick.pickLabel}</span>
                  ) : (
                    <span className="badge badge-warm text-[10.5px]">Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-5">
        <CardHead icon={<Target size={17} />} tag="Graded" title="Pick Results" />
        {history.length === 0 ? (
          <div className="text-center py-6">
            <Clock size={28} className="mx-auto mb-3 opacity-20" />
            <div className="text-[var(--text-mid)] text-[13.5px] font-medium">No graded picks yet</div>
            <div className="text-[var(--text-dim)] text-[12px] mt-1">
              Results appear here after matches finish and picks are graded.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--line)] last:border-0">
                <ResultIcon hit={h.result === "hit"} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]">{h.match}</div>
                  <div className="text-[var(--text-dim)] text-[11.5px] mt-0.5">
                    Your pick: <span className="text-[var(--text)]">{h.pick}</span>
                    {" · "}Final: {h.score}
                    {h.aiPick && h.aiPick !== h.pick && (
                      <span className="text-[var(--accent-warm)]"> · AI had {h.aiPick}</span>
                    )}
                  </div>
                </div>
                <span
                  className={`badge text-[10.5px] shrink-0 ${h.result === "hit" ? "badge-good" : "badge-bad"}`}
                >
                  {h.result === "hit" ? "Correct" : "Miss"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
