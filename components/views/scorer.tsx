"use client";

import { Footprints, Sparkles, Target } from "lucide-react";
import type { Scorer, WorldCupData } from "@/types/world-cup";
import { CardHead, Crest, Delta, ProbBar, teamColor } from "@/components/ui/primitives";

function GoalProgress({ goals, proj }: { goals: number; proj: number }) {
  const pct = proj > 0 ? Math.min(100, (goals / proj) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex-1 h-1 rounded-full bg-(--surface-2) overflow-hidden">
        <div
          className="h-full rounded-full bg-(--accent) transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-(--text-dim) text-[10px] tabular-nums shrink-0">{Math.round(pct)}%</span>
    </div>
  );
}

function ScorerRow({
  s,
  data,
  rank,
  maxProb,
}: {
  s: Scorer;
  data: WorldCupData;
  rank: number;
  maxProb: number;
}) {
  const t = data.teamMap[s.team];
  const isLeader = rank === 1;

  return (
    <div className="lift grid items-center gap-3 p-3 rounded-xl border border-(--line) [grid-template-columns:24px_36px_1fr_auto_auto] md:[grid-template-columns:30px_40px_1fr_72px_100px_130px_44px]">
      <span
        className="num text-[22px]"
        style={{ color: isLeader ? "var(--accent)" : "var(--text-dim)" }}
      >
        {rank}
      </span>

      <Crest team={t} size={32} />

      <div className="min-w-0">
        <div className="font-bold text-sm flex items-center gap-1.5 min-w-0">
          <span className="truncate">{s.player}</span>
          {s.pens && (
            <span className="badge badge-dim text-[10px] px-1.5 py-0 shrink-0">PK</span>
          )}
        </div>
        <div className="text-(--text-dim) text-[11.5px] truncate">{s.note}</div>
      </div>

      {/* Current goals — primary live stat */}
      <div className="text-right">
        <div className="num text-[22px] text-(--accent)">{s.goals}</div>
        <div className="section-tag">Goals</div>
      </div>

      {/* Projected total */}
      <div className="text-right max-md:hidden">
        <div className="num text-[17px]">{s.proj}</div>
        <div className="section-tag">Proj. total</div>
        <GoalProgress goals={s.goals} proj={s.proj} />
      </div>

      {/* Golden Boot probability */}
      <div className="max-md:hidden">
        <ProbBar value={(s.prob / maxProb) * 100} color={teamColor(t)} delay={rank * 40} />
        <div className="text-(--text-dim) text-[11px] mt-1 tabular-nums">
          Golden Boot {s.prob}%
        </div>
      </div>

      <Delta trend={s.trend} />
    </div>
  );
}

export function ScorerView({ data }: { data: WorldCupData }) {
  const sc = [...data.scorers];
  const maxProb = Math.max(...sc.map((s) => s.prob), 1);
  const leader = sc[0];
  const t = data.teamMap[leader.team];

  const tournamentStarted = sc.some((s) => s.goals > 0);

  const tiles = [
    {
      k: "Goals scored",
      v: String(leader.goals),
      note: tournamentStarted ? "Tournament goals" : "Pre-tournament",
    },
    {
      k: "Proj. total",
      v: String(leader.proj),
      note: "Final projected tally",
    },
    {
      k: "Games played",
      v: String(leader.gamesPlayed ?? 0),
      note: "Appearances",
    },
    {
      k: "Penalty taker",
      v: leader.pens ? "Yes" : "No",
      note: leader.pens ? "+ bonus" : "No bonus",
      good: leader.pens,
    },
    {
      k: "Group difficulty",
      v: String(leader.groupDifficulty ?? 0.94),
      note: "Favourable",
    },
    {
      k: "Injury risk",
      v: leader.injuryRisk ?? "Low",
      note: "Fully fit",
      good: leader.injuryRisk === "Low",
    },
  ];

  return (
    <div className="fade-in grid gap-[18px]">
      <div className="grid gap-[18px] grid-cols-1 md:[grid-template-columns:minmax(280px,360px)_1fr]">
        {/* Hero: current leader card */}
        <div
          className="card p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(150deg, var(--surface-2), var(--surface))",
          }}
        >
          <div className="section-tag">
            {tournamentStarted ? "Current golden boot leader" : "AI projected Golden Boot"}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative">
              <Crest team={t} size={68} />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-[9px] bg-(--accent) text-[#07090F] grid place-items-center shadow-lg">
                <Footprints size={15} />
              </div>
            </div>
            <div>
              <div className="display text-[26px] leading-tight">{leader.player}</div>
              <div className="text-(--text-mid) text-[13.5px] mt-0.5">
                {t.name} · {leader.pos}
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-6">
            <div>
              <div className="num text-[44px] text-(--accent) leading-[0.9]">{leader.goals}</div>
              <div className="section-tag mt-1">
                {tournamentStarted ? "Goals scored" : "Projected goals"}
              </div>
            </div>
            {tournamentStarted && (
              <div>
                <div className="num text-[44px] leading-[0.9]">{leader.proj}</div>
                <div className="section-tag mt-1">Projected total</div>
              </div>
            )}
            <div>
              <div className="num text-[44px] leading-[0.9]">
                {leader.prob}<span className="text-xl">%</span>
              </div>
              <div className="section-tag mt-1">Win probability</div>
            </div>
          </div>
        </div>

        {/* Formula tiles */}
        <div className="card p-5">
          <CardHead
            icon={<Sparkles size={17} />}
            tag="Top-scorer formula"
            title={`Why ${leader.player.split(" ").pop()} leads the model`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tiles.map((b) => (
              <div key={b.k} className="bg-(--surface-2) rounded-xl p-3.5">
                <div className="section-tag">{b.k}</div>
                <div
                  className="num text-[26px] mt-1"
                  style={{ color: b.good ? "var(--good)" : "var(--text)" }}
                >
                  {b.v}
                </div>
                <div className="text-(--text-dim) text-[11px]">{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-5">
        <CardHead
          icon={<Target size={17} />}
          tag="The race"
          title="Top Scorer Watch"
        />

        {/* Column headers — desktop only */}
        <div className="hidden md:grid gap-3 px-3 mb-1 text-(--text-dim) text-[11px] uppercase tracking-wide [grid-template-columns:30px_40px_1fr_72px_100px_130px_44px]">
          <span />
          <span />
          <span>Player</span>
          <span className="text-right">Goals</span>
          <span className="text-right">Proj. total</span>
          <span>Golden Boot</span>
          <span />
        </div>

        <div className="grid gap-2.5 stagger">
          {sc.map((s, i) => (
            <ScorerRow
              key={s.player}
              s={s}
              data={data}
              rank={i + 1}
              maxProb={maxProb}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
