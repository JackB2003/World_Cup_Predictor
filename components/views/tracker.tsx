"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock, Flame, Footprints, Target, Trophy, TrendingUp, X } from "lucide-react";
import type { DailyPick, WorldCupData } from "@/types/world-cup";
import { CardHead, Crest, Sparkline } from "@/components/ui/primitives";
import { fetchDailyPicks } from "@/lib/picks/client";
import { isPickLocked } from "@/features/picks/daily-picks";
import { basePath } from "@/lib/base-path";

const STAT = {
  "on-track": { cls: "badge-good", t: "On track" },
  risk: { cls: "badge-warm", t: "At risk" },
  leading: { cls: "badge-good", t: "Leading" },
};

function ResultIcon({ hit }: { hit: boolean }) {
  return (
    <span
      className={`w-[22px] h-[22px] rounded-[7px] grid place-items-center shrink-0 ${
        hit ? "bg-[rgba(var(--good-rgb),0.16)] text-[var(--good)]" : "bg-[rgba(var(--bad-rgb),0.16)] text-[var(--bad)]"
      }`}
    >
      {hit ? <Check size={13} /> : <X size={13} />}
    </span>
  );
}

export function TrackerView({ data }: { data: WorldCupData }) {
  const u = data.userPicks;
  const [pendingPicks, setPendingPicks] = useState<DailyPick[]>([]);

  const hits = u.history.filter((h) => h.result === "hit").length;
  const misses = u.history.filter((h) => h.result === "miss").length;
  const totalGraded = hits + misses;

  const top4OnTrack = u.top4.filter((p) => p.status === "on-track").length;
  const scorerData = data.scorers.find(
    (s) => s.player === u.topScorer.player || s.team === u.topScorer.team,
  );

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
      {/* Daily performance stats — no points or global rank */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card p-5 lift">
          <div className="section-tag">Pick accuracy</div>
          <div className="num text-[42px] mt-1 text-[var(--accent)]">
            {u.accuracy}<span className="text-[22px]">%</span>
          </div>
          <div className="text-[var(--text-dim)] text-xs mt-0.5">
            {totalGraded > 0 ? `${hits} of ${totalGraded} daily picks correct` : "No graded picks yet"}
          </div>
        </div>
        <div className="card p-5 lift">
          <div className="section-tag">Hot streak</div>
          <div className="num text-[42px] mt-1 flex items-center gap-2">
            {u.streak}
            {u.streak > 0 && <Flame size={24} className="text-[var(--accent-warm)]" />}
          </div>
          <div className="text-[var(--text-dim)] text-xs mt-0.5">correct in a row</div>
        </div>
        <div className="card p-5 lift">
          <div className="section-tag">Record</div>
          <div className="num text-[42px] mt-1">
            <span className="text-[var(--good)]">{hits}</span>
            <span className="text-[var(--text-dim)] mx-1">–</span>
            <span className="text-[var(--bad)]">{misses}</span>
          </div>
          <div className="text-[var(--text-dim)] text-xs mt-0.5">wins – losses on daily picks</div>
        </div>
      </div>

      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        {/* Daily match picks */}
        <div className="grid gap-[18px] content-start">
          <div className="card p-5">
            <CardHead icon={<Footprints size={17} />} tag="Daily picks" title="Match Pick Performance" />
            <div className="flex items-end gap-4 mb-4">
              <div className="num text-[48px] text-[var(--accent)] leading-[0.9]">
                {u.accuracy}<span className="text-[22px]">%</span>
              </div>
              <div className="flex-1">
                <Sparkline data={u.accuracyTrend} w={220} h={56} />
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
                  const home = data.teamMap[m.home];
                  const away = data.teamMap[m.awayCode];
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
            {u.history.length === 0 ? (
              <div className="text-center py-6">
                <Clock size={28} className="mx-auto mb-3 opacity-20" />
                <div className="text-[var(--text-mid)] text-[13.5px] font-medium">No graded picks yet</div>
                <div className="text-[var(--text-dim)] text-[12px] mt-1">
                  Results appear here after matches finish and picks are graded.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {u.history.map((h, i) => (
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

        {/* Season-long picks */}
        <div className="grid gap-[18px] content-start">
          <div className="card p-5">
            <CardHead icon={<Trophy size={17} />} tag="Locked picks" title="Season-Long Conviction" />
            <div className="flex items-center gap-3 mb-4 p-3 rounded-[11px] bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.2)]">
              <TrendingUp size={18} className="text-[var(--accent)] shrink-0" />
              <div className="text-[13px] text-[var(--text-mid)]">
                <span className="text-[var(--text)] font-bold">{top4OnTrack} of 4</span> top-4 picks still on track.
                These resolve at the end of the tournament — tracked by live model probability, not daily accuracy.
              </div>
            </div>

            <div className="section-tag mb-2">Top 4 finish (your order)</div>
            <div className="flex flex-col gap-2 mb-4">
              {u.top4.map((p) => {
                const t = data.teamMap[p.team];
                const st = STAT[p.status];
                const top4Prob = t?.top4 ?? 0;
                return (
                  <div key={p.pos} className="flex items-center gap-3 p-2.5 rounded-[11px] bg-[var(--surface-2)]">
                    <span className="num text-[var(--text-dim)] w-[18px] text-lg">{p.pos}</span>
                    <Crest team={t} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13.5px]">{t?.name ?? p.team}</div>
                      <div className="text-[var(--text-dim)] text-[11px]">{p.note}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="num text-[15px] text-[var(--accent)]">{top4Prob}%</div>
                      <div className="text-[10px] text-[var(--text-dim)]">top-4 prob</div>
                    </div>
                    <span className={`badge ${st.cls} shrink-0`}>{st.t}</span>
                  </div>
                );
              })}
            </div>

            <div className="section-tag mb-2">Golden boot</div>
            <div className="flex items-center gap-3 p-2.5 rounded-[11px] bg-[var(--surface-2)]">
              <Crest team={data.teamMap[u.topScorer.team]} size={28} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13.5px]">{u.topScorer.player}</div>
                <div className="text-[var(--text-dim)] text-[11px]">{u.topScorer.note}</div>
              </div>
              {scorerData && (
                <div className="text-right shrink-0">
                  <div className="num text-[15px] text-[var(--accent)]">{scorerData.prob}%</div>
                  <div className="text-[10px] text-[var(--text-dim)]">win prob</div>
                </div>
              )}
              <span className={`badge ${STAT[u.topScorer.status].cls} shrink-0`}>
                {STAT[u.topScorer.status].t}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
