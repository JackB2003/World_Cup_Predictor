"use client";

import Link from "next/link";
import { Bolt, ChevronRight, Flag, Trophy, Bell, Footprints } from "lucide-react";
import type { WorldCupData } from "@/types/world-cup";
import { CardHead, Crest, ProbBar, TriBar, teamColor } from "@/components/ui/primitives";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TimeLeft = { d: number; h: number; m: number; s: number };

function Countdown({ to }: { to: string }) {
  // Start as null so server and first client render match (no hydration
  // mismatch). The real values are computed on the client after mount, which
  // also guarantees the interval drives a live, ticking countdown.
  const [t, setT] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calc = (): TimeLeft => {
      const diff = Math.max(0, new Date(to).getTime() - Date.now());
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    };
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [to]);

  const Box = ({ v, l }: { v: number | null; l: string }) => (
    <div className="text-center">
      <div className="num text-[38px] leading-[0.9] text-[#07090F]" suppressHydrationWarning>
        {v === null ? "––" : String(v).padStart(2, "0")}
      </div>
      <div className="text-[9.5px] tracking-[0.16em] uppercase font-extrabold text-[rgba(7,9,15,0.65)] mt-0.5">{l}</div>
    </div>
  );

  return (
    <div className="flex gap-4">
      <Box v={t?.d ?? null} l="Days" /><Box v={t?.h ?? null} l="Hrs" /><Box v={t?.m ?? null} l="Min" /><Box v={t?.s ?? null} l="Sec" />
    </div>
  );
}

export function OverviewView({ data }: { data: WorldCupData }) {
  const router = useRouter();
  const teams = [...data.teams].sort((a, b) => b.titleProb - a.titleProb).slice(0, 5);
  const maxT = teams[0]?.titleProb ?? 1;
  const topMatch = [...data.matches].sort((a, b) => b.conf - a.conf)[0];
  const sc = data.scorers.slice(0, 4);
  const maxS = Math.max(...sc.map((s) => s.prob), 1);
  const alerts = data.news.filter((n) => n.sev === "high").slice(0, 5);

  if (!topMatch) return null;
  const home = data.teamMap[topMatch.home];
  const away = data.teamMap[topMatch.awayCode];
  const pickLabel = topMatch.pickKind === "draw" ? "Draw" : `${data.teamMap[topMatch.pick]?.name ?? topMatch.pick} Win`;

  return (
    <div className="fade-in grid gap-[18px] grid-cols-1 md:grid-cols-[1.5fr_1fr]">
      <div className="card col-span-full overflow-hidden p-0 text-[#07090F]" style={{ background: "linear-gradient(110deg, var(--accent), #9be63a 60%, var(--accent-3))" }}>
        <div className="flex items-center gap-7 p-7 relative flex-wrap max-md:gap-4 max-md:p-5 max-md:justify-center">
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "repeating-linear-gradient(135deg, #07090F 0 2px, transparent 2px 22px)" }} />
          <div className="relative flex-1 min-w-[180px] max-md:min-w-full max-md:text-center">
            <div className="flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.14em] uppercase max-md:justify-center">
              <Flag size={14} /> {data.meta.hosts}
            </div>
            <div className="display text-[40px] leading-none my-2">Kickoff in</div>
            <div className="text-[13.5px] font-semibold opacity-70">
              {data.meta.tournament}
            </div>
          </div>
          <div className="relative"><Countdown to={data.meta.kickoff} /></div>
          <div className="relative border-l border-[rgba(7,9,15,0.2)] pl-7 max-md:pl-5 max-md:text-center">
            <div className="num text-[52px] leading-[0.85]">{data.meta.matchesToday}</div>
            <div className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase opacity-70">Matches today</div>
            <Link href="/picks" className="mt-3 inline-flex items-center gap-1.5 bg-[#07090F] text-(--accent) px-3.5 py-2 rounded-[10px] text-xs font-bold">
              View today&apos;s picks <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <CardHead icon={<Bolt size={17} />} tag="Highest-confidence pick" title="Lock of the Day" more="All matches" onMore={() => router.push("/picks")} />
        <Link href="/picks">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 mb-3.5">
            <div className="flex items-center gap-2 min-w-0"><Crest team={home} size={36} /><b className="text-sm truncate">{home.name}</b></div>
            <div className="num text-[30px] text-center whitespace-nowrap">{topMatch.score[0]}<span className="text-(--text-dim) mx-1">–</span>{topMatch.score[1]}</div>
            <div className="flex items-center gap-2 flex-row-reverse min-w-0"><Crest team={away} size={36} /><b className="text-sm truncate">{away.name}</b></div>
          </div>
          <TriBar winH={topMatch.winH} draw={topMatch.draw} winA={topMatch.winA} homeColor={teamColor(home)} awayColor={teamColor(away)} />
          <div className="flex items-center mt-3.5 gap-3">
            <span className="badge badge-accent"><Bolt size={12} /> {pickLabel}</span>
            <span className="text-(--text-dim) text-xs">{topMatch.stage}</span>
            <span className="ml-auto num text-[26px] text-(--good)">{topMatch.conf}%</span>
          </div>
        </Link>
      </div>

      <div className="card p-5">
        <CardHead icon={<Trophy size={17} />} tag="Championship odds" title="Title Race" more="Outlook" onMore={() => router.push("/outlook")} />
        <div className="flex flex-col gap-2.5">
          {teams.map((t, i) => (
            <div key={t.code} className="flex items-center gap-2.5">
              <Crest team={t} size={26} />
              <span className="w-[74px] text-[13px] font-semibold">{t.name}</span>
              <div className="flex-1"><ProbBar value={(t.titleProb / maxT) * 100} color={teamColor(t)} delay={i * 50} /></div>
              <span className="num w-11 text-right text-lg">{t.titleProb}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <CardHead icon={<Footprints size={17} />} tag="Golden Boot watch" title="Top Scorer Race" more="Watch" onMore={() => router.push("/scorer")} />
        <div className="flex flex-col gap-2.5">
          {sc.map((s, i) => {
            const t = data.teamMap[s.team];
            return (
              <div key={s.player} className="flex items-center gap-2.5">
                <span className="num text-(--text-dim) w-4 text-base">{i + 1}</span>
                <Crest team={t} size={26} />
                <span className="flex-1 text-[13px] font-semibold">{s.player}</span>
                <div className="w-[70px]"><ProbBar value={(s.prob / maxS) * 100} color={teamColor(t)} height={7} delay={i * 50} /></div>
                <span className="num w-10 text-right text-lg text-(--accent)">{s.proj}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <CardHead icon={<Bell size={17} />} tag="Needs your attention" title="High-Impact Alerts" more="All news" onMore={() => router.push("/news")} />
        <div className="flex flex-col gap-2.5">
          {alerts.map((n, i) => (
            <div key={i} className="flex gap-2.5 items-start p-2.5 rounded-[11px] bg-(--surface-2)">
              <span className="w-[26px] h-[26px] rounded-lg grid place-items-center bg-[rgba(var(--bad-rgb),0.16)] text-(--bad) shrink-0">
                <Bell size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold leading-snug">{n.title}</div>
                <div className="text-(--text-dim) text-[11.5px] mt-0.5">{n.impact} · {n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
