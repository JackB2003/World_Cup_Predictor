"use client";

import { useState } from "react";
import { Bolt, Check, ChevronRight, Clock, Info, RefreshCw } from "lucide-react";
import type { Match, WorldCupData } from "@/types/world-cup";
import { Crest, LocalTime, TriBar, teamColor } from "@/components/ui/primitives";

function MatchCard({ m, data, expanded, onToggle }: { m: Match; data: WorldCupData; expanded: boolean; onToggle: () => void }) {
  const home = data.teamMap[m.home];
  const away = data.teamMap[m.awayCode];
  const pickLabel = m.pickKind === "draw" ? "Draw" : `${data.teamMap[m.pick]?.name ?? m.pick} Win`;
  const confColor = m.conf >= 65 ? "var(--good)" : m.conf >= 50 ? "var(--accent)" : "var(--accent-warm)";
  const badgeCls = m.tag === "High confidence" ? "badge-good" : m.tag === "Upset watch" ? "badge-warm" : m.tag === "Coin flip" ? "badge-dim" : "badge-accent";

  return (
    <div className={`card lift p-[18px] cursor-pointer ${expanded ? "is-open" : ""}`} onClick={onToggle}>
      <div className="flex items-center gap-2.5 mb-3.5">
        <span className="section-tag">{m.stage}</span>
        <span className="text-[var(--text-dim)] text-xs flex items-center gap-1"><Clock size={12} /> <LocalTime iso={m.kickoffAt} fallback={m.time} /></span>
        <span className={`badge ${badgeCls} ml-auto`}>{m.tag}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Crest team={home} size={42} />
          <div>
            <div className="font-bold text-[14.5px]">{home.name}</div>
            <div className="text-[var(--text-dim)] text-[11.5px]">Elo {home.elo}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="num text-[40px] leading-[0.9] whitespace-nowrap">
            {m.score[0]}<span className="text-[var(--text-dim)] mx-1.5">–</span>{m.score[1]}
          </div>
          <div className="section-tag mt-0.5">Predicted</div>
        </div>
        <div className="flex items-center gap-2.5 justify-end">
          <div className="text-right">
            <div className="font-bold text-[14.5px]">{away.name}</div>
            <div className="text-[var(--text-dim)] text-[11.5px]">Elo {away.elo}</div>
          </div>
          <Crest team={away} size={42} />
        </div>
      </div>

      <div className="flex items-center gap-3.5 mt-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs mb-1.5">
            <Bolt size={13} className="text-[var(--accent)]" />
            <b className="text-[var(--accent)]">AI Pick:</b>
            <span className="font-bold">{pickLabel}</span>
          </div>
          <TriBar winH={m.winH} draw={m.draw} winA={m.winA} homeColor={teamColor(home)} awayColor={teamColor(away)} />
          <div className="flex justify-between mt-1.5 text-[11.5px] text-[var(--text-dim)] tabular-nums">
            <span>{home.code} {m.winH}%</span><span>Draw {m.draw}%</span><span>{away.code} {m.winA}%</span>
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="num text-[30px] leading-none" style={{ color: confColor }}>{m.conf}<span className="text-sm">%</span></div>
          <div className="section-tag">Confidence</div>
        </div>
      </div>

      <div className="overflow-hidden transition-[max-height] duration-350" style={{ maxHeight: expanded ? 380 : 0 }}>
        <hr className="border-0 h-px bg-[var(--line)] my-4" />
        <div className="section-tag mb-2">Why the model picks this</div>
        <div className="flex flex-col gap-2">
          {m.reasons.map((r, i) => (
            <div key={i} className="flex gap-2 text-[13px] items-start">
              <Check size={14} className="text-[var(--accent)] mt-0.5 shrink-0" />
              <span className="text-[var(--text-mid)]">{r}</span>
            </div>
          ))}
        </div>
        {m.risk && (
          <div className="flex gap-2.5 items-start mt-3.5 p-3 rounded-[11px] bg-[rgba(255,178,61,0.09)] border border-[rgba(255,178,61,0.22)]">
            <Info size={15} className="text-[var(--accent-warm)] shrink-0 mt-0.5" />
            <div>
              <div className="section-tag text-[var(--accent-warm)] mb-0.5">Risk factor</div>
              <span className="text-[var(--text-mid)] text-[13px]">{m.risk}</span>
            </div>
          </div>
        )}
        <div className="text-[var(--text-dim)] text-[11px] mt-3 flex items-center gap-1">
          <Clock size={12} /> Data freshness: updated {data.meta.lastUpdate} · picks lock at kickoff
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 mt-3 text-[11.5px] text-[var(--text-dim)] font-semibold">
        {expanded ? "Hide reasoning" : "Tap for AI reasoning"} <ChevronRight size={12} />
      </div>
    </div>
  );
}

export function PicksView({ data }: { data: WorldCupData }) {
  const [open, setOpen] = useState<string | null>(data.matches[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "conf">("all");
  const shown = filter === "all" ? data.matches : data.matches.filter((m) => m.conf >= 60);

  return (
    <div className="fade-in">
      <div className="flex items-center gap-3.5 mb-4 flex-wrap">
        <div className="segment">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All {data.matches.length}</button>
          <button className={filter === "conf" ? "on" : ""} onClick={() => setFilter("conf")}>High confidence</button>
        </div>
        <div className="badge badge-dim ml-auto px-3 py-1.5">
          <RefreshCw size={13} /> Morning refresh · {data.meta.lastUpdate}
        </div>
      </div>
      <div className="grid gap-[18px] stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
        {shown.map((m) => (
          <MatchCard key={m.id} m={m} data={data} expanded={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
        ))}
      </div>
    </div>
  );
}
