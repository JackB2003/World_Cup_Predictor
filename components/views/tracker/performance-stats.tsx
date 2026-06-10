"use client";

import { Flame } from "lucide-react";

type PerformanceStatsProps = {
  accuracy: number;
  streak: number;
  hits: number;
  misses: number;
};

export function PerformanceStats({ accuracy, streak, hits, misses }: PerformanceStatsProps) {
  const totalGraded = hits + misses;

  return (
    <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      <div className="card p-5 lift">
        <div className="section-tag">Pick accuracy</div>
        <div className="num text-[42px] mt-1 text-[var(--accent)]">
          {accuracy}<span className="text-[22px]">%</span>
        </div>
        <div className="text-[var(--text-dim)] text-xs mt-0.5">
          {totalGraded > 0 ? `${hits} of ${totalGraded} daily picks correct` : "No graded picks yet"}
        </div>
      </div>
      <div className="card p-5 lift">
        <div className="section-tag">Hot streak</div>
        <div className="num text-[42px] mt-1 flex items-center gap-2">
          {streak}
          {streak > 0 && <Flame size={24} className="text-[var(--accent-warm)]" />}
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
  );
}
