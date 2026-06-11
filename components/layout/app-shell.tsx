"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Footprints, Grid3X3, Menu, Target, Trophy, X,
} from "lucide-react";
import type { WorldCupData } from "@/types/world-cup";
import { LocalTime } from "@/components/ui/primitives";

const OWNER_NAME = process.env.NEXT_PUBLIC_TRACKER_OWNER_NAME ?? "";
const OWNER_INITIALS = process.env.NEXT_PUBLIC_TRACKER_OWNER_INITIALS ?? "WC";
const TRACKER_LABEL = OWNER_NAME ? `${OWNER_NAME}'s Pick Tracker` : "Pick Tracker";

const NAV = [
  { id: "/overview", label: "Overview", icon: Grid3X3 },
  { id: "/picks", label: "Today's Picks", icon: Footprints, badge: true },
  { id: "/outlook", label: "Tournament Outlook", icon: Trophy },
  { id: "/scorer", label: "Top Scorer Watch", icon: Target },
  { id: "/news", label: "News & Alerts", icon: Bell, badgeNews: true },
  { id: "/tracker", label: TRACKER_LABEL, icon: Target },
];

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/overview": { title: "Overview", sub: "Your daily AI prediction briefing" },
  "/picks": { title: "Today's Picks", sub: "AI match predictions for all of today's fixtures" },
  "/outlook": { title: "Tournament Outlook", sub: "Championship odds & projected finishers · 10,000 simulations" },
  "/scorer": { title: "Top Scorer Watch", sub: "Golden Boot projections & the scoring race" },
  "/news": { title: "News & Injury Alerts", sub: "Latest injury, suspension & roster intel that moves the model" },
  "/tracker": { title: TRACKER_LABEL, sub: "Your picks vs what actually happened" },
};

export function AppShell({ data, children }: { data: WorldCupData; children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? PAGE_META["/overview"];
  const highAlerts = data.news.filter((n) => n.sev === "high").length;
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div
      className="md:grid min-h-screen"
      style={{
        gridTemplateColumns: "var(--sidebar-w) 1fr",
        background: `radial-gradient(1200px 700px at 78% -10%, rgba(var(--accent-rgb), 0.07), transparent 60%), radial-gradient(900px 600px at -5% 105%, rgba(var(--accent-2-rgb), 0.06), transparent 55%), var(--bg)`,
      }}
    >
      {/* Mobile backdrop */}
      {navOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={`border-r border-(--line) bg-linear-to-b from-(--bg-2) to-(--bg) flex flex-col py-5 px-4 gap-1.5 max-[1080px]:px-2.5 max-[1080px]:items-center max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[252px] max-md:items-stretch max-md:px-4 max-md:transition-transform max-md:duration-200 ${
          navOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        }`}
      >
        <button
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="md:hidden absolute top-4 right-3 w-8 h-8 rounded-lg grid place-items-center text-(--text-mid) hover:bg-(--surface) hover:text-(--text)"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 px-2 pb-4 max-[1080px]:justify-center max-md:justify-start">
          <div className="w-10 h-10 rounded-xl bg-(--accent) grid place-items-center text-[#07090F] shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.4)]">
            <Trophy size={22} />
          </div>
          <div className="max-[1080px]:hidden max-md:block">
            <div className="display text-[15px] leading-tight">PITCH<span className="text-(--accent)">IQ</span></div>
            <div className="text-[10.5px] text-(--text-dim) tracking-[0.14em] uppercase mt-0.5">WC26 Predictor</div>
          </div>
        </div>

        <div className="section-tag px-3 pt-3 pb-1 max-[1080px]:hidden max-md:block">Dashboard</div>
        {NAV.map((n) => {
          const active = pathname === n.id || (n.id === "/overview" && pathname === "/");
          const Icon = n.icon;
          const badge = n.badge ? data.matches.length : n.badgeNews ? highAlerts : 0;
          return (
            <Link
              key={n.id}
              href={n.id}
              onClick={() => setNavOpen(false)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold relative transition-colors max-[1080px]:justify-center max-[1080px]:px-2.5 max-md:justify-start max-md:px-3 ${
                active ? "bg-(--surface-2) text-(--text)" : "text-(--text-mid) hover:bg-(--surface) hover:text-(--text)"
              }`}
            >
              {active && <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-[22px] rounded-r bg-(--accent) max-[1080px]:-left-2.5 max-md:-left-4" />}
              <Icon size={19} />
              <span className="max-[1080px]:hidden max-md:inline">{n.label}</span>
              {badge > 0 && (
                <span className="ml-auto bg-(--accent-2) text-white text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-full min-w-5 text-center max-[1080px]:hidden max-md:inline-block">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="mt-auto max-[1080px]:hidden max-md:block">
          <div className="card p-3.5">
            <div className="section-tag">Your pick accuracy</div>
            {data.userPicks.history.length > 0 ? (
              <>
                <div className="num text-[30px] text-(--accent) leading-none mt-1">
                  {data.userPicks.accuracy}<span className="text-[18px]">%</span>
                </div>
                <div className="text-[11.5px] text-(--text-mid) mt-0.5">
                  across {data.userPicks.history.length} graded pick{data.userPicks.history.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <>
                <div className="num text-[30px] text-(--text-dim) leading-none mt-1">—</div>
                <div className="text-[11.5px] text-(--text-dim) mt-0.5">picks grade after matches finish</div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="overflow-y-auto overflow-x-hidden h-screen min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-7 py-4 backdrop-blur-md bg-[rgba(7,9,15,0.85)] max-md:px-4 max-md:gap-3">
          <button
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            className="md:hidden shrink-0 w-10 h-10 rounded-xl border border-(--line) bg-(--surface) grid place-items-center text-(--text-mid) hover:text-(--text)"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="display text-[26px] m-0 max-md:text-[20px]">{meta.title}</h1>
            <p className="text-[13px] text-(--text-dim) m-0 mt-0.5 max-md:hidden">{meta.sub}</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-[rgba(var(--good-rgb),0.12)] border border-[rgba(var(--good-rgb),0.28)] text-(--good) rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap max-md:hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-(--good)" />
            Updated <LocalTime iso={data.meta.lastUpdateAt} fallback={data.meta.lastUpdate} />
            <span className="text-(--text-dim) font-semibold">· next {data.meta.nextRefresh}</span>
          </div>
          <div className="w-9 h-9 rounded-[11px] bg-linear-to-br from-(--accent) to-(--accent-3) grid place-items-center text-[#07090F] font-extrabold text-sm display">{OWNER_INITIALS}</div>
        </header>
        <div className="px-7 pb-12 pt-1 max-md:px-4">{children}</div>
      </main>
    </div>
  );
}
