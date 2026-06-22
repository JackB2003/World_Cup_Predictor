import type { Scorer, Team } from "@/types/world-cup";

type PbTeamRecord = {
  id?: string;
  code: string;
  name: string;
  color: string;
  txt?: string;
  elo: number;
  fifa: number;
  group: string;
  titleProb: number;
  top4: number;
  advance: number;
  form?: string[];
  gf: number;
  ga: number;
  xg: number;
  conf: string;
  trend: number;
  host?: boolean;
  apiTeamId?: number;
};

type PbScorerRecord = Omit<Scorer, "team" | "pos"> & {
  teamCode: string;
  position: string;
  gamesPlayed?: number;
};

export function mapTeamRecord(raw: unknown): Team {
  const t = raw as PbTeamRecord;
  return {
    ...(t.id ? { id: t.id } : {}),
    code: t.code,
    name: t.name,
    color: t.color,
    ...(t.txt ? { txt: t.txt } : {}),
    elo: t.elo,
    fifa: t.fifa,
    group: t.group,
    titleProb: t.titleProb,
    top4: t.top4,
    advance: t.advance,
    form: (t.form ?? []) as Team["form"],
    gf: t.gf,
    ga: t.ga,
    xg: t.xg,
    conf: t.conf,
    trend: t.trend,
    host: t.host,
    ...(t.apiTeamId != null ? { apiTeamId: t.apiTeamId } : {}),
  };
}

export function mapScorerRecord(raw: unknown): Scorer {
  const s = raw as PbScorerRecord;
  return {
    ...(s.id ? { id: s.id } : {}),
    player: s.player,
    team: s.teamCode,
    pos: s.position,
    proj: s.proj,
    prob: s.prob,
    goals: s.goals,
    g90: s.g90,
    pens: s.pens,
    minutes: s.minutes,
    conf: s.conf,
    trend: s.trend,
    note: s.note,
    projectedMatches: s.projectedMatches,
    groupDifficulty: s.groupDifficulty,
    injuryRisk: s.injuryRisk,
    gamesPlayed: s.gamesPlayed,
  };
}
