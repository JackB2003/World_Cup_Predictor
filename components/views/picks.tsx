"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bolt, Check, ChevronRight, Clock, Info, RefreshCw, Target } from "lucide-react";
import type { DailyPick, DailyPickChoice, Match, WorldCupData } from "@/types/world-cup";
import { Crest, LocalTime, TriBar, teamColor } from "@/components/ui/primitives";
import { fetchDailyPicks, saveDailyPick } from "@/lib/picks/client";
import { isPickLocked } from "@/features/picks/daily-picks";

function PickButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
        active
          ? "bg-(--accent) text-[#07090F] border-(--accent)"
          : disabled
            ? "bg-(--surface-2) text-(--text-dim) border-(--line) cursor-not-allowed opacity-60"
            : "bg-(--surface-2) text-(--text-mid) border-(--line) hover:border-(--accent) hover:text-(--text)"
      }`}
    >
      {children}
    </button>
  );
}

function MatchCard({
  m,
  data,
  expanded,
  onToggle,
  userPick,
  onPick,
  saving,
}: {
  m: Match;
  data: WorldCupData;
  expanded: boolean;
  onToggle: () => void;
  userPick?: DailyPick;
  onPick: (choice: DailyPickChoice) => void;
  saving: boolean;
}) {
  const home = data.teamMap[m.home];
  const away = data.teamMap[m.awayCode];
  const pickLabel = m.pickKind === "draw" ? "Draw" : `${data.teamMap[m.pick]?.name ?? m.pick} Win`;
  const confColor = m.conf >= 65 ? "var(--good)" : m.conf >= 50 ? "var(--accent)" : "var(--accent-warm)";
  const badgeCls = m.tag === "High confidence" ? "badge-good" : m.tag === "Upset watch" ? "badge-warm" : m.tag === "Coin flip" ? "badge-dim" : "badge-accent";
  const locked = userPick?.locked ?? isPickLocked(m.kickoffAt);

  return (
    <div className={`card lift p-[18px] cursor-pointer ${expanded ? "is-open" : ""}`} onClick={onToggle}>
      <div className="flex items-center gap-2.5 mb-3.5">
        <span className="section-tag">{m.stage}</span>
        <span className="text-(--text-dim) text-xs flex items-center gap-1"><Clock size={12} /> <LocalTime iso={m.kickoffAt} fallback={m.time} /></span>
        <span className={`badge ${badgeCls} ml-auto`}>{m.tag}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Crest team={home} size={42} />
          <div className="min-w-0">
            <div className="font-bold text-[14.5px] truncate">{home.name}</div>
            <div className="text-(--text-dim) text-[11.5px]">Elo {home.elo}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="num text-[40px] leading-[0.9] whitespace-nowrap">
            {m.score[0]}<span className="text-(--text-dim) mx-1.5">–</span>{m.score[1]}
          </div>
          <div className="section-tag mt-0.5">Predicted</div>
        </div>
        <div className="flex items-center gap-2.5 justify-end min-w-0">
          <div className="text-right min-w-0">
            <div className="font-bold text-[14.5px] truncate">{away.name}</div>
            <div className="text-(--text-dim) text-[11.5px]">Elo {away.elo}</div>
          </div>
          <Crest team={away} size={42} />
        </div>
      </div>

      <div
        className="mt-4 p-3 rounded-[11px] border border-(--line) bg-(--surface-2)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Target size={14} className="text-(--accent-2)" />
          <span className="section-tag">Jack&apos;s pick</span>
          {locked && <span className="badge badge-dim text-[10px] ml-auto">Locked</span>}
          {!locked && !userPick && <span className="badge badge-warm text-[10px] ml-auto">Not set</span>}
          {!locked && userPick && <span className="badge badge-good text-[10px] ml-auto">Saved</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <PickButton active={userPick?.choice === "home"} disabled={locked || saving} onClick={() => onPick("home")}>
            {home.code} Win
          </PickButton>
          <PickButton active={userPick?.choice === "draw"} disabled={locked || saving} onClick={() => onPick("draw")}>
            Draw
          </PickButton>
          <PickButton active={userPick?.choice === "away"} disabled={locked || saving} onClick={() => onPick("away")}>
            {away.code} Win
          </PickButton>
        </div>
        {userPick && (
          <div className="text-(--text-dim) text-[11px] mt-2">
            Your pick: <span className="text-(--text) font-semibold">{userPick.pickLabel}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3.5 mt-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs mb-1.5">
            <Bolt size={13} className="text-(--accent)" />
            <b className="text-(--accent)">AI Pick:</b>
            <span className="font-bold">{pickLabel}</span>
          </div>
          <TriBar winH={m.winH} draw={m.draw} winA={m.winA} homeColor={teamColor(home)} awayColor={teamColor(away)} />
          <div className="flex justify-between mt-1.5 text-[11.5px] text-(--text-dim) tabular-nums">
            <span>{home.code} {m.winH}%</span><span>Draw {m.draw}%</span><span>{away.code} {m.winA}%</span>
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="num text-[30px] leading-none" style={{ color: confColor }}>{m.conf}<span className="text-sm">%</span></div>
          <div className="section-tag">Confidence</div>
        </div>
      </div>

      <div className="overflow-hidden transition-[max-height] duration-350" style={{ maxHeight: expanded ? 380 : 0 }}>
        <hr className="border-0 h-px bg-(--line) my-4" />
        <div className="section-tag mb-2">Why the model picks this</div>
        <div className="flex flex-col gap-2">
          {m.reasons.map((r, i) => (
            <div key={i} className="flex gap-2 text-[13px] items-start">
              <Check size={14} className="text-(--accent) mt-0.5 shrink-0" />
              <span className="text-(--text-mid)">{r}</span>
            </div>
          ))}
        </div>
        {m.risk && (
          <div className="flex gap-2.5 items-start mt-3.5 p-3 rounded-[11px] bg-[rgba(255,178,61,0.09)] border border-[rgba(255,178,61,0.22)]">
            <Info size={15} className="text-(--accent-warm) shrink-0 mt-0.5" />
            <div>
              <div className="section-tag text-(--accent-warm) mb-0.5">Risk factor</div>
              <span className="text-(--text-mid) text-[13px]">{m.risk}</span>
            </div>
          </div>
        )}
        <div className="text-(--text-dim) text-[11px] mt-3 flex items-center gap-1">
          <Clock size={12} /> Data freshness: updated {data.meta.lastUpdate} · picks lock at kickoff
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 mt-3 text-[11.5px] text-(--text-dim) font-semibold">
        {expanded ? "Hide reasoning" : "Tap for AI reasoning"} <ChevronRight size={12} />
      </div>
    </div>
  );
}

export function PicksView({ data }: { data: WorldCupData }) {
  const [open, setOpen] = useState<string | null>(data.matches[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "conf">("all");
  const [picks, setPicks] = useState<Record<string, DailyPick>>({});
  const [pickSource, setPickSource] = useState<"pocketbase" | "local" | "unavailable" | "loading">("loading");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teamNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const t of data.teams) names[t.code] = t.name;
    return names;
  }, [data.teams]);

  const loadPicks = useCallback(async () => {
    const ids = data.matches.map((m) => m.id);
    const { picks: loaded, source } = await fetchDailyPicks(ids);
    const map: Record<string, DailyPick> = {};
    for (const p of loaded) map[p.matchId] = p;
    setPicks(map);
    setPickSource(source);
  }, [data.matches]);

  useEffect(() => {
    loadPicks();
  }, [loadPicks]);

  const handlePick = async (m: Match, choice: DailyPickChoice) => {
    setError(null);
    setSavingId(m.id);
    try {
      const { pick } = await saveDailyPick(m.id, choice, m.home, m.awayCode, m.kickoffAt, teamNames);
      setPicks((prev) => ({ ...prev, [m.id]: pick }));
      if (pickSource === "unavailable" || pickSource === "loading") {
        setPickSource("local");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pick");
    } finally {
      setSavingId(null);
    }
  };

  const shown = filter === "all" ? data.matches : data.matches.filter((m) => m.conf >= 60);
  const setCount = data.matches.filter((m) => picks[m.id]).length;
  const unsetCount = data.matches.length - setCount;

  return (
    <div className="fade-in">
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="font-bold text-[14px]">Submit your picks before kickoff</div>
          <div className="text-(--text-dim) text-[12.5px] mt-0.5">
            Tap Home Win, Draw, or Away Win on each match. Unset picks stay blank — the app won&apos;t default to the AI.
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="badge badge-good">{setCount} set</span>
          {unsetCount > 0 && <span className="badge badge-warm">{unsetCount} not set</span>}
          {pickSource === "pocketbase" && <span className="badge badge-dim text-[10px]">Saved to server</span>}
          {pickSource === "local" && <span className="badge badge-warm text-[10px]">Saved locally (dev mode)</span>}
        </div>
      </div>

      {error && (
        <div className="card p-3 mb-4 border-[rgba(var(--bad-rgb),0.3)] text-(--bad) text-[13px]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3.5 mb-4 flex-wrap">
        <div className="segment self-start">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All {data.matches.length}</button>
          <button className={filter === "conf" ? "on" : ""} onClick={() => setFilter("conf")}>High confidence</button>
        </div>
        <div className="badge badge-dim ml-auto px-3 py-1.5">
          <RefreshCw size={13} /> Morning refresh · {data.meta.lastUpdate}
        </div>
      </div>

      {data.matches.length === 0 ? (
        <div className="card p-8 text-center">
          <Clock size={28} className="mx-auto mb-3 opacity-20" />
          <div className="text-(--text-mid) font-medium mb-1">No matches scheduled right now</div>
          <div className="text-(--text-dim) text-[12.5px]">Check back after the morning refresh when fixtures are loaded.</div>
        </div>
      ) : (
        <div className="grid gap-[18px] stagger grid-cols-1 md:[grid-template-columns:repeat(auto-fill,minmax(420px,1fr))]">
          {shown.map((m) => (
            <MatchCard
              key={m.id}
              m={m}
              data={data}
              expanded={open === m.id}
              onToggle={() => setOpen(open === m.id ? null : m.id)}
              userPick={picks[m.id]}
              onPick={(choice) => handlePick(m, choice)}
              saving={savingId === m.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
