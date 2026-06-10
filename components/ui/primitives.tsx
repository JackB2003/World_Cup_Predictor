"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Minus } from "lucide-react";
import type { FormResult, Team } from "@/types/world-cup";
import { teamBarColor } from "@/lib/utils";

export function LocalTime({
  iso,
  fallback = "",
  withDate = false,
}: {
  iso?: string;
  fallback?: string;
  withDate?: boolean;
}) {
  const [label, setLabel] = useState(fallback);
  useEffect(() => {
    if (!iso) {
      setLabel(fallback);
      return;
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setLabel(fallback);
      return;
    }
    setLabel(
      d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        ...(withDate ? { month: "short", day: "numeric" } : {}),
      }),
    );
  }, [iso, fallback, withDate]);
  return <span suppressHydrationWarning>{label || fallback}</span>;
}

export function Crest({ team, size = 36 }: { team?: Team; code?: string; size?: number }) {
  const t = team ?? { code: "???", color: "#444", txt: "#fff" } as Team;
  return (
    <div
      className="crest"
      style={{
        width: size,
        height: size,
        background: t.color,
        color: t.txt || "#fff",
        fontSize: size * 0.36,
        borderRadius: Math.max(7, size * 0.24),
      }}
    >
      <span className="relative z-[1]">{t.code}</span>
    </div>
  );
}

export function ProbBar({ value, color, height = 8, delay = 0 }: { value: number; color?: string; height?: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(value), 60 + delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return (
    <div className="probbar" style={{ height }}>
      <i style={{ width: `${w}%`, background: color || "var(--accent)" }} />
    </div>
  );
}

export function TriBar({ winH, draw, winA, homeColor, awayColor }: { winH: number; draw: number; winA: number; homeColor: string; awayColor: string }) {
  return (
    <div className="flex h-2 overflow-hidden rounded-md gap-0.5">
      <div style={{ width: `${winH}%`, background: homeColor }} title={`Home ${winH}%`} />
      <div style={{ width: `${draw}%`, background: "var(--text-dim)" }} title={`Draw ${draw}%`} />
      <div style={{ width: `${winA}%`, background: awayColor }} title={`Away ${winA}%`} />
    </div>
  );
}

export function FormRow({ form }: { form: FormResult[] }) {
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span key={i} className={`form-pill fp-${r}`}>{r}</span>
      ))}
    </div>
  );
}

export function Delta({ trend }: { trend: number }) {
  if (trend > 0) return <span className="text-[var(--good)] text-xs font-extrabold inline-flex items-center gap-0.5"><ArrowUp size={12} />{trend}</span>;
  if (trend < 0) return <span className="text-[var(--bad)] text-xs font-extrabold inline-flex items-center gap-0.5"><ArrowDown size={12} />{Math.abs(trend)}</span>;
  return <span className="text-[var(--text-dim)] text-xs font-extrabold inline-flex items-center"><Minus size={12} /></span>;
}

export function CardHead({ icon, tag, title, more, onMore }: { icon?: React.ReactNode; tag?: string; title: string; more?: string; onMore?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && <div className="w-[30px] h-[30px] rounded-[9px] grid place-items-center bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]">{icon}</div>}
      <div className="flex-1">
        {tag && <div className="section-tag">{tag}</div>}
        <h3 className="display text-[15px] m-0">{title}</h3>
      </div>
      {more && onMore && (
        <button onClick={onMore} className="text-[var(--text-dim)] text-xs font-semibold flex items-center gap-1 hover:text-[var(--text)]">
          {more} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export function Sparkline({ data, w = 120, h = 36, color = "var(--accent)" }: { data: number[]; w?: number; h?: number; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / range) * (h - 6) - 3]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  const gid = `sg-${data.join("-")}`;
  return (
    <svg width={w} height={h} className="block overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

export function teamColor(team: Team) {
  return teamBarColor(team.color);
}
