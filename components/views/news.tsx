"use client";

import { useState } from "react";
import { Bell, Bolt, RefreshCw, TrendingUp, Activity, BarChart3, Users, AlertTriangle } from "lucide-react";
import type { NewsItem, WorldCupData } from "@/types/world-cup";
import { CardHead, Crest } from "@/components/ui/primitives";

const SEV_MAP = {
  high: { cls: "badge-bad", dot: "var(--bad)", label: "High impact" },
  med: { cls: "badge-warm", dot: "var(--accent-warm)", label: "Medium" },
  low: { cls: "badge-dim", dot: "var(--text-dim)", label: "Low" },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  injury: <Activity size={12} />,
  suspension: <AlertTriangle size={12} />,
  odds: <BarChart3 size={12} />,
  form: <TrendingUp size={12} />,
  lineup: <Users size={12} />,
  news: <Bell size={12} />,
};

function NewsItemCard({ n, data }: { n: NewsItem; data: WorldCupData }) {
  const t = data.teamMap[n.team];
  const sev = SEV_MAP[n.sev];
  return (
    <div className="lift flex gap-3.5 p-4 rounded-[14px] border border-[var(--line)]">
      <div className="relative">
        <Crest team={t} size={44} />
        <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-[7px] grid place-items-center text-[#07090F]" style={{ background: sev.dot }}>
          {TYPE_ICON[n.type] ?? <Bell size={12} />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge ${sev.cls} text-[10.5px]`}>{sev.label}</span>
          <span className="text-[var(--text-dim)] text-[11.5px] capitalize">{n.type === "form" ? "momentum" : n.type}</span>
          <span className="text-[var(--text-dim)] text-[11.5px] ml-auto">{n.time}</span>
        </div>
        <div className="font-bold text-[14.5px] mb-1">{n.title}</div>
        <div className="text-[var(--text-mid)] text-[12.5px] leading-relaxed">{n.body}</div>
        <div className="mt-2">
          <span className="badge badge-accent text-[11px]"><Bolt size={11} /> {n.impact}</span>
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | "fitness" | "odds" | "form" | "lineup";

export function NewsView({ data }: { data: WorldCupData }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = {
    all: data.news.length,
    fitness: data.news.filter((n) => n.type === "injury" || n.type === "suspension").length,
    odds: data.news.filter((n) => n.type === "odds").length,
    form: data.news.filter((n) => n.type === "form").length,
    lineup: data.news.filter((n) => n.type === "lineup").length,
    high: data.news.filter((n) => n.sev === "high").length,
  };

  const shown =
    filter === "all"
      ? data.news
      : filter === "fitness"
        ? data.news.filter((n) => n.type === "injury" || n.type === "suspension")
        : data.news.filter((n) => n.type === filter);

  const shown_sorted = [...shown].sort((a, b) => {
    const sevOrder = { high: 0, med: 1, low: 2 };
    return (sevOrder[a.sev] ?? 1) - (sevOrder[b.sev] ?? 1);
  });

  return (
    <div className="fade-in grid gap-[18px]" style={{ gridTemplateColumns: "1fr 300px" }}>
      <div className="grid gap-3.5 content-start">
        <div className="segment self-start">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
            All {counts.all > 0 && <span className="ml-1 opacity-60 text-[10px]">{counts.all}</span>}
          </button>
          <button className={filter === "fitness" ? "on" : ""} onClick={() => setFilter("fitness")}>
            Injuries {counts.fitness > 0 && <span className="ml-1 opacity-60 text-[10px]">{counts.fitness}</span>}
          </button>
          <button className={filter === "odds" ? "on" : ""} onClick={() => setFilter("odds")}>
            Odds {counts.odds > 0 && <span className="ml-1 opacity-60 text-[10px]">{counts.odds}</span>}
          </button>
          <button className={filter === "form" ? "on" : ""} onClick={() => setFilter("form")}>
            Form {counts.form > 0 && <span className="ml-1 opacity-60 text-[10px]">{counts.form}</span>}
          </button>
          <button className={filter === "lineup" ? "on" : ""} onClick={() => setFilter("lineup")}>
            Lineups {counts.lineup > 0 && <span className="ml-1 opacity-60 text-[10px]">{counts.lineup}</span>}
          </button>
        </div>
        {shown_sorted.length === 0 ? (
          <div className="card p-8 text-center">
            <Bell size={28} className="mx-auto mb-3 opacity-20" />
            <div className="text-[var(--text-mid)] text-[13.5px] font-medium mb-1">No alerts in this category</div>
            <div className="text-[var(--text-dim)] text-[12px]">
              {filter === "lineup" ? "Lineups are announced ~1 hour before kickoff" : "Check back after the next data refresh"}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 stagger">
            {shown_sorted.map((n, i) => <NewsItemCard key={n.id ?? i} n={n} data={data} />)}
          </div>
        )}
      </div>

      <div className="grid gap-[18px]">
        <div className="card p-5">
          <CardHead icon={<Bell size={17} />} title="Alert Summary" />
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="num text-[36px] text-[var(--bad)] leading-none">{counts.high}</div>
              <div className="text-[var(--text-mid)] text-[13px]">High-impact alerts<br /><span className="text-[var(--text-dim)] text-[11.5px]">affecting picks</span></div>
            </div>
            <hr className="border-0 h-px bg-[var(--line)]" />
            <div className="flex items-center gap-3">
              <div className="num text-[36px] text-[var(--accent-warm)] leading-none">{counts.fitness}</div>
              <div className="text-[var(--text-mid)] text-[13px]">Fitness concerns<br /><span className="text-[var(--text-dim)] text-[11.5px]">injuries + suspensions</span></div>
            </div>
            <hr className="border-0 h-px bg-[var(--line)]" />
            <div className="flex items-center gap-3">
              <div className="num text-[36px] text-[var(--text-dim)] leading-none">{counts.odds}</div>
              <div className="text-[var(--text-mid)] text-[13px]">Odds alerts<br /><span className="text-[var(--text-dim)] text-[11.5px]">market signals</span></div>
            </div>
          </div>
        </div>
        <div className="card p-5" style={{ background: "linear-gradient(150deg, rgba(var(--accent-rgb),0.08), var(--surface))" }}>
          <div className="flex items-center gap-2 mb-2"><RefreshCw size={16} /><span className="section-tag">Data sources</span></div>
          <div className="text-[var(--text-mid)] text-[13px] leading-relaxed space-y-2">
            <div><span className="text-[var(--text)] font-medium">Injuries/Bans</span> — API-Football, updated at 6am & pre-match</div>
            <div><span className="text-[var(--text)] font-medium">Odds</span> — Market data, auto-generated from latest odds</div>
            <div><span className="text-[var(--text)] font-medium">Form</span> — Auto-generated from pre-tournament results</div>
            <div><span className="text-[var(--text)] font-medium">Lineups</span> — Announced ~1hr before kickoff</div>
          </div>
        </div>
      </div>
    </div>
  );
}
