export type ApiTeamRef = { id: number; name: string; code?: string | null; winner?: boolean | null };

export type ApiFixtureItem = {
  fixture: { id: number; date: string; status: { short: string } };
  league: { round: string };
  teams: { home: ApiTeamRef; away: ApiTeamRef };
  goals: { home: number | null; away: number | null };
  venue: { name?: string; city?: string };
};

export type ApiStandingsGroup = {
  group: string;
  standings: Array<Array<{
    rank: number;
    team: ApiTeamRef;
    points: number;
    goalsDiff: number;
    group: string;
    all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
    description?: string | null;
  }>>;
};

export type ApiInjuryItem = {
  player: { id: number; name: string; photo?: string };
  team: ApiTeamRef;
  fixture: { id: number; timezone: string; date: string; timestamp: number };
  league: { id: number; season: number; name: string };
  type: string;
  reason: string;
};

export type ApiTeamStatistics = {
  team: ApiTeamRef;
  league: { id: number; season: number };
  form?: string;
  fixtures: { played: { total: number }; wins: { total: number }; draws: { total: number }; loses: { total: number } };
  goals: {
    for: { total: { total: number | null }; average: { total: string | null } };
    against: { total: { total: number | null }; average: { total: string | null } };
  };
};

export type ApiListResponse<T> = {
  response?: T;
  results?: number;
  errors?: unknown;
};
