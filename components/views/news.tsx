"use client";

import { useState } from "react";
import { Bell, Bolt, RefreshCw } from "lucide-react";
import type { NewsItem, WorldCupData } from "@/types/world-cup";
import { CardHead, Crest } from "@/components/ui/primitives";

const SEV_MAP = {
  high: { cls: "badge-bad", dot: "var(--bad)", label: "High impact" },
  med: { cls: "badge-warm", dot: "var(--accent-warm)", label: "Medium" },
  low: { cls: "badge-dim", dot: "var(--text-dim)", label: "Low" },
};

function NewsItemCard({ n, data }: { n: NewsItem; data: WorldCupData }) {
  const t = data.teamMap[n.team];
  const sev = SEV_MAP[n.sev];
  return (
    <div className="lift flex gap-3.5 p-4 rounded-[14px] border border-[var(--line)]">
      <div className="relative">
        <Crest team={t} size={44} />
        <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-[7px] grid place-items-center text-[#07090F]" style={{ background: sev.dot }}>
          <Bell size={12} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge ${sev.cls} text-[10.5px]`}>{sev.label}</span>
          <span className="text-[var(--text-dim)] text-[11.5px] capitalize">{n.type}</span>
          <span className="text-[var(--text-dim)] text-[11.5px] ml-auto">{n.time}</span>
        </div>
        <div className="font-bold text-[14.5px] mb-1">{n.title}</div>
        <div className="text-[var(--text-mid)] text-[12.5px] leading-relaxed">{n.body}</div>
        <div className="mt-2">
          <span className="badge badge-accent text-[11px]"><Bolt size={11} /> Model impact: {n.impact}</span>
        </div>
      </div>
    </div>
  );
}

export function NewsView({ data }: { data: WorldCupData }) {
  const [filter, setFilter] = useState<"all" | "fitness" | "lineup" | "odds">("all");
  const shown =
    filter === "all"
      ? data.news
      : filter === "fitness"
        ? data.news.filter((n) => n.type === "injury" || n.type === "suspension")
        : data.news.filter((n) => n.type === filter);

  const counts = {
    high: data.news.filter((n) => n.sev === "high").length,
    fitness: data.news.filter((n) => n.type === "injury" || n.type === "suspension").length,
  };

  return (
    <div className="fade-in grid gap-[18px]" style={{ gridTemplateColumns: "1fr 300px" }}>
      <div className="grid gap-3.5">
        <div className="segment">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "fitness" ? "on" : ""} onClick={() => setFilter("fitness")}>Injuries & bans</button>
          <button className={filter === "lineup" ? "on" : ""} onClick={() => setFilter("lineup")}>Lineups</button>
          <button className={filter === "odds" ? "on" : ""} onClick={() => setFilter("odds")}>Odds</button>
        </div>
        <div className="grid gap-3 stagger">
          {shown.map((n, i) => <NewsItemCard key={n.id ?? i} n={n} data={data} />)}
        </div>
      </div>

      <div className="grid gap-[18px]">
        <div className="card p-5">
          <CardHead icon={<Bell size={17} />} title="Alert Summary" />
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="num text-[36px] text-[var(--bad)] leading-none">{counts.high}</div>
              <div className="text-[var(--text-mid)] text-[13px]">High-impact alerts<br /><span className="text-[var(--text-dim)] text-[11.5px]">affecting today&apos;s picks</span></div>
            </div>
            <hr className="border-0 h-px bg-[var(--line)]" />
            <div className="flex items-center gap-3">
              <div className="num text-[36px] text-[var(--accent-warm)] leading-none">{counts.fitness}</div>
              <div className="text-[var(--text-mid)] text-[13px]">Fitness items<br /><span className="text-[var(--text-dim)] text-[11.5px]">injuries + suspensions</span></div>
            </div>
          </div>
        </div>
        <div className="card p-5" style={{ background: "linear-gradient(150deg, rgba(var(--accent-rgb),0.08), var(--surface))" }}>
          <div className="flex items-center gap-2 mb-2"><RefreshCw size={16} /><span className="section-tag">Refresh schedule</span></div>
          <div className="text-[var(--text-mid)] text-[13px] leading-relaxed">
            Pre-match only — no live tracking. A morning refresh updates results, standings, injuries & top scorers, with an optional pre-match pass 1–2 hrs before the first kickoff. Predictions recalculate before picks lock.
          </div>
        </div>
      </div>
    </div>
  );
}
