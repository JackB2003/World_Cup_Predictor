"use client";

import { Check, Clock, Flame, Target, Trophy, X } from "lucide-react";
import type { WorldCupData } from "@/types/world-cup";
import { CardHead, Crest, Sparkline } from "@/components/ui/primitives";

const STAT = {
  "on-track": { cls: "badge-good", t: "On track" },
  risk: { cls: "badge-warm", t: "At risk" },
  leading: { cls: "badge-good", t: "Leading" },
};

export function TrackerView({ data }: { data: WorldCupData }) {
  const u = data.userPicks;

  return (
    <div className="fade-in grid gap-[18px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { l: "Total points", v: u.points.toLocaleString(), accent: true, sub: "this tournament" },
          { l: "Global rank", v: `#${u.rank}`, sub: `of ${u.totalUsers.toLocaleString()} players` },
          { l: "Pick accuracy", v: `${u.accuracy}%`, sub: "last 14 picks" },
          { l: "Hot streak", v: String(u.streak), sub: "correct in a row", fire: true },
        ].map((k) => (
          <div key={k.l} className="card p-5 lift">
            <div className="section-tag">{k.l}</div>
            <div className="num text-[42px] mt-1 flex items-center gap-2" style={{ color: k.accent ? "var(--accent)" : "var(--text)" }}>
              {k.v}{k.fire && <Flame size={24} className="text-[var(--accent-warm)]" />}
            </div>
            <div className="text-[var(--text-dim)] text-xs mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card p-5">
          <CardHead icon={<Trophy size={17} />} tag="Your one-time picks" title="Tournament Predictions" />
          <div className="section-tag mb-2">Top 4 finish</div>
          <div className="flex flex-col gap-2 mb-4">
            {u.top4.map((p) => {
              const t = data.teamMap[p.team];
              const st = STAT[p.status];
              return (
                <div key={p.pos} className="flex items-center gap-3 p-2.5 rounded-[11px] bg-[var(--surface-2)]">
                  <span className="num text-[var(--text-dim)] w-[18px] text-lg">{p.pos}</span>
                  <Crest team={t} size={28} />
                  <span className="font-bold text-[13.5px] flex-1">{t.name}</span>
                  <span className="text-[var(--text-dim)] text-[11.5px]">{p.note}</span>
                  <span className={`badge ${st.cls}`}>{st.t}</span>
                </div>
              );
            })}
          </div>
          <div className="section-tag mb-2">Top scorer</div>
          <div className="flex items-center gap-3 p-2.5 rounded-[11px] bg-[var(--surface-2)]">
            <Crest team={data.teamMap[u.topScorer.team]} size={28} />
            <span className="font-bold text-[13.5px] flex-1">{u.topScorer.player}</span>
            <span className="text-[var(--text-dim)] text-[11.5px]">{u.topScorer.note}</span>
            <span className="badge badge-good">{STAT[u.topScorer.status].t}</span>
          </div>
        </div>

        <div className="grid gap-[18px]">
          <div className="card p-5">
            <CardHead icon={<Target size={17} />} tag="Trend" title="Accuracy Over Time" />
            <div className="flex items-end gap-4">
              <div className="num text-[48px] text-[var(--accent)] leading-[0.9]">{u.accuracy}<span className="text-[22px]">%</span></div>
              <div className="flex-1"><Sparkline data={u.accuracyTrend} w={220} h={56} /></div>
            </div>
          </div>
          <div className="card p-5">
            <CardHead icon={<Clock size={17} />} tag="Recent results" title="Prediction History" />
            <div className="flex flex-col gap-1.5">
              {u.history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--line)] last:border-0">
                  <span className={`w-[22px] h-[22px] rounded-[7px] grid place-items-center shrink-0 ${h.result === "hit" ? "bg-[rgba(var(--good-rgb),0.16)] text-[var(--good)]" : "bg-[rgba(var(--bad-rgb),0.16)] text-[var(--bad)]"}`}>
                    {h.result === "hit" ? <Check size={13} /> : <X size={13} />}
                  </span>
                  <span className="font-semibold text-[13px] w-[110px]">{h.match}</span>
                  <span className="text-[var(--text-dim)] text-xs flex-1">
                    You: {h.pick}
                    {h.aiPick && h.aiPick !== h.pick && <> · AI: {h.aiPick}</>}
                    {" · "}{h.score}
                  </span>
                  <span className="num text-lg" style={{ color: h.pts ? "var(--good)" : "var(--text-dim)" }}>+{h.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
