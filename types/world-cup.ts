export type FormResult = "W" | "D" | "L";
export type AccentKey = "lime" | "cyan" | "magenta" | "violet" | "amber";
export type ThemeMode = "dark" | "light";
export type Density = "compact" | "regular" | "comfy";

export interface Team {
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
  form: FormResult[];
  gf: number;
  ga: number;
  xg: number;
  conf: string;
  trend: number;
  host?: boolean;
  apiTeamId?: number;
}

export interface Match {
  id: string;
  time: string;
  venue: string;
  stage: string;
  home: string;
  away: string;
  awayCode: string;
  pick: string;
  pickKind: "win" | "draw";
  score: [number, number];
  conf: number;
  winH: number;
  draw: number;
  winA: number;
  reasons: string[];
  risk: string;
  tag: string;
  kickoffAt?: string;
  status?: string;
  apiFixtureId?: number;
}

export interface Scorer {
  id?: string;
  player: string;
  team: string;
  pos: string;
  proj: number;
  prob: number;
  goals: number;
  g90: number;
  pens: boolean;
  minutes: number;
  conf: number;
  trend: number;
  note: string;
  projectedMatches?: number;
  groupDifficulty?: number;
  injuryRisk?: string;
}

export interface NewsItem {
  id?: string;
  type: "injury" | "suspension" | "lineup" | "news" | "odds";
  sev: "high" | "med" | "low";
  team: string;
  title: string;
  time: string;
  impact: string;
  body: string;
  icon: string;
}

export interface UserTop4Pick {
  pos: number;
  team: string;
  status: "on-track" | "risk";
  note: string;
}

export interface UserPicks {
  points: number;
  rank: number;
  totalUsers: number;
  accuracy: number;
  streak: number;
  top4: UserTop4Pick[];
  topScorer: {
    player: string;
    team: string;
    status: "leading" | "on-track" | "risk";
    note: string;
  };
  history: {
    match: string;
    pick: string;
    aiPick?: string;
    result: "hit" | "miss";
    pts: number;
    score: string;
  }[];
  accuracyTrend: number[];
}

export interface ModelWeight {
  factor: string;
  weight: number;
  color: string;
}

export interface Meta {
  tournament: string;
  hosts: string;
  kickoff: string;
  simRuns: number;
  lastUpdate: string;
  lastUpdateAt?: string;
  nextRefresh: string;
  matchesToday: number;
}

export interface WorldCupData {
  teams: Team[];
  teamMap: Record<string, Team>;
  matches: Match[];
  scorers: Scorer[];
  news: NewsItem[];
  userPicks: UserPicks;
  modelWeights: ModelWeight[];
  meta: Meta;
}
