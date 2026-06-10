"use client";

import { Info, Sparkles, Target, TrendingUp, Trophy } from "lucide-react";
import type { Team, WorldCupData } from "@/types/world-cup";
import { CardHead, Crest, Delta, FormRow, ProbBar, teamColor } from "@/components/ui/primitives";

function TitleRaceRow({ t, max, rank }: { t: Team; max: number; rank: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="num text-[var(--text-dim)] w-[22px] text-lg text-right">{rank}</span>
      <Crest team={t} size={30} />
      <span className="w-[92px] font-semibold text-[13.5px]">{t.name}</span>
      <div className="flex-1"><ProbBar value={(t.titleProb / max) * 100} color={teamColor(t)} height={10} delay={rank * 40} /></div>
      <span className="num w-14 text-right text-xl">{t.titleProb}<span className="text-[var(--text-dim)] text-xs">%</span></span>
      <Delta trend={t.trend} />
    </div>
  );
}

function PowerRow({ t, rank }: { t: Team; rank: number }) {
  return (
    <div className="lift flex items-center gap-3 p-3 rounded-xl border border-[var(--line)]">
      <span className="num w-[26px] text-[22px]" style={{ color: rank <= 3 ? "var(--accent)" : "var(--text-dim)" }}>{rank}</span>
      <Crest team={t} size={32} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{t.name}</div>
        <div className="text-[var(--text-dim)] text-[11.5px]">{t.conf}</div>
      </div>
      <FormRow form={t.form} />
      <div className="text-right w-14">
        <div className="num text-lg">{t.elo}</div>
        <div className="section-tag">Elo</div>
      </div>
      <Delta trend={t.trend} />
    </div>
  );
}

export function OutlookView({ data }: { data: WorldCupData }) {
  const teams = [...data.teams].sort((a, b) => b.titleProb - a.titleProb);
  const max = teams[0]?.titleProb ?? 1;
  const top4 = teams.slice(0, 4);
  const medals = ["#FFD24A", "#C7CEDB", "#E08A4A", "#7E8AA0"];

  return (
    <div className="fade-in grid gap-[18px]" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
      <div className="card p-5">
        <CardHead icon={<Trophy size={17} />} tag="Monte Carlo · 10,000 simulations" title="Championship Probability" />
        <div className="flex flex-col gap-3">
          {teams.slice(0, 10).map((t, i) => <TitleRaceRow key={t.code} t={t} max={max} rank={i + 1} />)}
        </div>
        <div className="text-[var(--text-dim)] text-[11.5px] mt-4 flex items-center gap-1.5">
          <Info size={13} /> Probabilities re-simulated each daily refresh from current form, injuries & schedule.
        </div>
      </div>

      <div className="grid gap-[18px]">
        <div className="card p-5">
          <CardHead icon={<Target size={17} />} tag="Projected finish" title="The Final Four" />
          <div className="flex flex-col gap-2.5">
            {top4.map((t, i) => (
              <div key={t.code} className="lift flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface-2)]">
                <div className="num w-[34px] h-[34px] rounded-[9px] grid place-items-center text-xl text-[#07090F]" style={{ background: medals[i] }}>{i + 1}</div>
                <Crest team={t} size={30} />
                <span className="font-bold text-sm flex-1">{t.name}</span>
                <div className="text-right">
                  <div className="num text-lg text-[var(--accent)]">{t.top4}%</div>
                  <div className="section-tag">Top-4 odds</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <CardHead icon={<Sparkles size={17} />} tag="How the model thinks" title="Prediction Weights" />
          <div className="flex h-3 rounded-lg overflow-hidden mb-4">
            {data.modelWeights.map((w) => <div key={w.factor} style={{ width: `${w.weight}%`, background: w.color }} title={`${w.factor} ${w.weight}%`} />)}
          </div>
          <div className="flex flex-col gap-2">
            {data.modelWeights.map((w) => (
              <div key={w.factor} className="flex items-center gap-2 text-[13px]">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: w.color }} />
                <span className="text-[var(--text-mid)] flex-1">{w.factor}</span>
                <span className="num text-base">{w.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 col-span-full">
        <CardHead icon={<TrendingUp size={17} />} tag="Daily power index" title="Team Power Rankings" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {[...data.teams].sort((a, b) => b.elo - a.elo).map((t, i) => <PowerRow key={t.code} t={t} rank={i + 1} />)}
        </div>
      </div>
    </div>
  );
}
