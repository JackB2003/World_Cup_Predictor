"use client";

import { TrendingUp, Trophy } from "lucide-react";
import type { Scorer, Team, UserPicks } from "@/types/world-cup";
import { CardHead, Crest } from "@/components/ui/primitives";

const STAT = {
  "on-track": { cls: "badge-good", t: "On track" },
  risk: { cls: "badge-warm", t: "At risk" },
  leading: { cls: "badge-good", t: "Leading" },
};

type SeasonLongSectionProps = {
  top4: UserPicks["top4"];
  topScorer: UserPicks["topScorer"];
  teamMap: Record<string, Team>;
  scorers: Scorer[];
};

export function SeasonLongSection({ top4, topScorer, teamMap, scorers }: SeasonLongSectionProps) {
  const top4OnTrack = top4.filter((p) => p.status === "on-track").length;
  const scorerData = scorers.find(
    (s) => s.player === topScorer.player || s.team === topScorer.team,
  );

  return (
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
        {top4.map((p) => {
          const t = teamMap[p.team];
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
        <Crest team={teamMap[topScorer.team]} size={28} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[13.5px]">{topScorer.player}</div>
          <div className="text-[var(--text-dim)] text-[11px]">{topScorer.note}</div>
        </div>
        {scorerData && (
          <div className="text-right shrink-0">
            <div className="num text-[15px] text-[var(--accent)]">{scorerData.prob}%</div>
            <div className="text-[10px] text-[var(--text-dim)]">win prob</div>
          </div>
        )}
        <span className={`badge ${STAT[topScorer.status].cls} shrink-0`}>
          {STAT[topScorer.status].t}
        </span>
      </div>
    </div>
  );
}
