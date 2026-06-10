"use client";

import { Footprints, Sparkles } from "lucide-react";
import type { Scorer, WorldCupData } from "@/types/world-cup";
import { CardHead, Crest, Delta, ProbBar, teamColor } from "@/components/ui/primitives";

function ScorerRow({ s, data, rank, max }: { s: Scorer; data: WorldCupData; rank: number; max: number }) {
  const t = data.teamMap[s.team];
  return (
    <div className="lift grid items-center gap-3 p-3 rounded-xl border border-[var(--line)]" style={{ gridTemplateColumns: "30px 40px 1fr 120px 70px 44px" }}>
      <span className="num text-[22px]" style={{ color: rank === 1 ? "var(--accent)" : "var(--text-dim)" }}>{rank}</span>
      <Crest team={t} size={32} />
      <div className="min-w-0">
        <div className="font-bold text-sm flex items-center gap-1.5">
          {s.player}
          {s.pens && <span className="badge badge-dim text-[10px] px-1.5 py-0">PK</span>}
        </div>
        <div className="text-[var(--text-dim)] text-[11.5px] truncate">{s.note}</div>
      </div>
      <div>
        <ProbBar value={(s.prob / max) * 100} color={teamColor(t)} delay={rank * 40} />
        <div className="text-[var(--text-dim)] text-[11px] mt-1 tabular-nums">Golden Boot {s.prob}%</div>
      </div>
      <div className="text-right">
        <div className="num text-[22px] text-[var(--accent)]">{s.proj}</div>
        <div className="section-tag">Proj. goals</div>
      </div>
      <Delta trend={s.trend} />
    </div>
  );
}

export function ScorerView({ data }: { data: WorldCupData }) {
  const sc = [...data.scorers];
  const max = Math.max(...sc.map((s) => s.prob), 1);
  const leader = sc[0];
  const t = data.teamMap[leader.team];

  const tiles = [
    { k: "Proj. matches", v: String(leader.projectedMatches ?? 7), note: "Deep tournament run" },
    { k: "Expected mins", v: `${leader.minutes}'`, note: "Per match" },
    { k: "Goals / 90", v: String(leader.g90), note: "Elite rate" },
    { k: "Penalty taker", v: leader.pens ? "Yes" : "No", note: leader.pens ? "+ bonus" : "No bonus", good: leader.pens },
    { k: "Group difficulty", v: String(leader.groupDifficulty ?? 0.94), note: "Favourable" },
    { k: "Injury risk", v: leader.injuryRisk ?? "Low", note: "Fully fit", good: leader.injuryRisk === "Low" },
  ];

  return (
    <div className="fade-in grid gap-[18px]">
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "minmax(280px, 360px) 1fr" }}>
        <div className="card p-5 relative overflow-hidden" style={{ background: "linear-gradient(150deg, var(--surface-2), var(--surface))" }}>
          <div className="section-tag">AI projected Golden Boot</div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative">
              <Crest team={t} size={68} />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-[9px] bg-[var(--accent)] text-[#07090F] grid place-items-center shadow-lg">
                <Footprints size={15} />
              </div>
            </div>
            <div>
              <div className="display text-[26px] leading-tight">{leader.player}</div>
              <div className="text-[var(--text-mid)] text-[13.5px] mt-0.5">{t.name} · {leader.pos}</div>
            </div>
          </div>
          <div className="flex gap-6 mt-6">
            <div>
              <div className="num text-[44px] text-[var(--accent)] leading-[0.9]">{leader.proj}</div>
              <div className="section-tag mt-1">Projected goals</div>
            </div>
            <div>
              <div className="num text-[44px] leading-[0.9]">{leader.prob}<span className="text-xl">%</span></div>
              <div className="section-tag mt-1">Win probability</div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <CardHead icon={<Sparkles size={17} />} tag="Top-scorer formula" title={`Why ${leader.player.split(" ").pop()} leads the model`} />
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((b) => (
              <div key={b.k} className="bg-[var(--surface-2)] rounded-xl p-3.5">
                <div className="section-tag">{b.k}</div>
                <div className="num text-[26px] mt-1" style={{ color: b.good ? "var(--good)" : "var(--text)" }}>{b.v}</div>
                <div className="text-[var(--text-dim)] text-[11px]">{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <CardHead icon={<Footprints size={17} />} tag="The race" title="Golden Boot Leaderboard" />
        <div className="grid gap-2.5 stagger">
          {sc.map((s, i) => <ScorerRow key={s.player} s={s} data={data} rank={i + 1} max={max} />)}
        </div>
      </div>
    </div>
  );
}
