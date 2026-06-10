import { apiFootball } from "@/lib/api-football/client";
import { resolveTeamCode } from "@/lib/api-football/team-codes";
import type {
  ApiFixtureItem,
  ApiInjuryItem,
  ApiListResponse,
  ApiStandingsGroup,
  ApiTeamStatistics,
} from "@/lib/api-football/types";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import { isToday } from "@/lib/utils";
import type { FormResult } from "@/types/world-cup";
import type { ensureAdminAuth } from "@/lib/pocketbase/admin";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
const API_NEWS_ICON = "api-injury";

async function loadPbTeamRefs(pb: Pb) {
  const raw = await pb.collection(COLLECTIONS.teams).getFullList();
  return raw.map((r) => ({
    record: r,
    team: mapTeamRecord(r),
  }));
}

function formFromApiString(form: string | undefined): FormResult[] {
  if (!form) return [];
  return form
    .split("")
    .filter((c): c is FormResult => c === "W" || c === "D" || c === "L")
    .slice(0, 5);
}

function formFromFixtures(teamApiId: number, fixtures: ApiFixtureItem[]): FormResult[] {
  const results: FormResult[] = [];
  const finished = fixtures
    .filter((f) => FINISHED_STATUSES.has(f.fixture.status.short))
    .filter((f) => f.teams.home.id === teamApiId || f.teams.away.id === teamApiId)
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());

  for (const f of finished) {
    if (results.length >= 5) break;
    const isHome = f.teams.home.id === teamApiId;
    const gf = isHome ? f.goals.home : f.goals.away;
    const ga = isHome ? f.goals.away : f.goals.home;
    if (gf == null || ga == null) continue;
    if (gf > ga) results.push("W");
    else if (gf < ga) results.push("L");
    else results.push("D");
  }
  return results;
}

function estimateXg(gf: number, played: number, existingXg?: number): number {
  if (existingXg && existingXg > 0) return existingXg;
  const gpg = played > 0 ? gf / played : 1;
  return Math.round(Math.min(3.2, Math.max(0.7, gpg * 0.92)) * 10) / 10;
}

function injurySeverity(reason: string, type: string): "high" | "med" | "low" {
  const text = `${reason} ${type}`.toLowerCase();
  if (/doubt|out|suspended|red card|hamstring|acl|fracture|rupture/.test(text)) return "high";
  if (/injury|muscle|knock|fitness|illness/.test(text)) return "med";
  return "low";
}

export async function syncFixtures(pb: Pb, leagueId: string, season: string): Promise<number> {
  const refs = await loadPbTeamRefs(pb);
  const pbTeams = refs.map((r) => r.team);

  const res = (await apiFootball.fixtures({ league: leagueId, season })) as ApiListResponse<ApiFixtureItem[]>;
  let count = 0;
  let skipped = 0;

  for (const item of res.response ?? []) {
    const homeCode = resolveTeamCode(item.teams.home, pbTeams);
    const awayCode = resolveTeamCode(item.teams.away, pbTeams);
    if (!homeCode || !awayCode) {
      skipped++;
      console.warn(
        `  skip fixture ${item.fixture.id}: unresolved team(s) ${item.teams.home.name} vs ${item.teams.away.name}`,
      );
      continue;
    }

    const matchId = `af-${item.fixture.id}`;
    const existing = await pb.collection(COLLECTIONS.matches).getFullList({
      filter: `matchId = "${matchId}"`,
    });

    const payload = {
      matchId,
      kickoffAt: item.fixture.date,
      time: new Date(item.fixture.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      venue: `${item.venue?.name ?? ""} · ${item.venue?.city ?? ""}`.trim(),
      stage: item.league.round,
      homeCode,
      awayCode,
      status: item.fixture.status.short,
      scoreHome: item.goals.home ?? 0,
      scoreAway: item.goals.away ?? 0,
      apiFixtureId: item.fixture.id,
      lastUpdated: new Date().toISOString(),
    };

    if (existing[0]) {
      await pb.collection(COLLECTIONS.matches).update(existing[0].id, payload);
    } else {
      await pb.collection(COLLECTIONS.matches).create(payload);
    }
    count++;
  }

  if (skipped) console.warn(`  ${skipped} fixture(s) skipped due to unknown team codes`);
  return count;
}

export async function syncTeamLinks(pb: Pb, leagueId: string, season: string): Promise<number> {
  const refs = await loadPbTeamRefs(pb);
  const pbTeams = refs.map((r) => r.team);

  const res = (await apiFootball.teams({ league: leagueId, season })) as ApiListResponse<
    Array<{ team: { id: number; name: string; code?: string | null; country: string } }>
  >;

  let updated = 0;
  for (const item of res.response ?? []) {
    const code = resolveTeamCode(item.team, pbTeams);
    if (!code) continue;

    const existing = refs.find((r) => r.team.code === code);
    if (!existing) continue;

    await pb.collection(COLLECTIONS.teams).update(existing.record.id, {
      apiTeamId: item.team.id,
      name: item.team.name,
      lastUpdated: new Date().toISOString(),
    });
    updated++;
  }
  return updated;
}

export async function syncStandings(pb: Pb, leagueId: string, season: string): Promise<number> {
  const refs = await loadPbTeamRefs(pb);
  const pbTeams = refs.map((r) => r.team);

  const res = (await apiFootball.standings({ league: leagueId, season })) as ApiListResponse<
    ApiStandingsGroup[]
  >;

  let count = 0;
  for (const block of res.response ?? []) {
    for (const groupRows of block.standings ?? []) {
      for (const row of groupRows) {
        const code = resolveTeamCode(row.team, pbTeams);
        if (!code) continue;

        const groupLetter = row.group?.replace(/^Group\s+/i, "").trim() || block.group?.replace(/^Group\s+/i, "").trim() || "";
        const played = row.all.played ?? 0;
        const gf = row.all.goals.for ?? 0;
        const ga = row.all.goals.against ?? 0;

        const existingStanding = await pb.collection(COLLECTIONS.standings).getFullList({
          filter: `teamCode = "${code}"`,
        });
        const standingPayload = {
          teamCode: code,
          group: groupLetter,
          played,
          wins: row.all.win ?? 0,
          draws: row.all.draw ?? 0,
          losses: row.all.lose ?? 0,
          gf,
          ga,
          gd: row.goalsDiff ?? gf - ga,
          points: row.points ?? 0,
          qualification: row.description ?? "",
          lastUpdated: new Date().toISOString(),
        };

        if (existingStanding[0]) {
          await pb.collection(COLLECTIONS.standings).update(existingStanding[0].id, standingPayload);
        } else {
          await pb.collection(COLLECTIONS.standings).create(standingPayload);
        }

        const teamRef = refs.find((r) => r.team.code === code);
        if (teamRef) {
          const team = teamRef.team;
          await pb.collection(COLLECTIONS.teams).update(teamRef.record.id, {
            group: groupLetter || team.group,
            gf,
            ga,
            xg: estimateXg(gf, played, team.xg),
            lastUpdated: new Date().toISOString(),
          });
        }
        count++;
      }
    }
  }
  return count;
}

export async function syncFormFromFixtures(pb: Pb, leagueId: string, season: string): Promise<number> {
  const refs = await loadPbTeamRefs(pb);
  const res = (await apiFootball.fixtures({ league: leagueId, season })) as ApiListResponse<ApiFixtureItem[]>;
  const fixtures = res.response ?? [];

  let updated = 0;
  for (const { record, team } of refs) {
    if (!team.apiTeamId) continue;
    const form = formFromFixtures(team.apiTeamId, fixtures);
    if (!form.length) continue;

    await pb.collection(COLLECTIONS.teams).update(record.id, {
      form,
      lastUpdated: new Date().toISOString(),
    });
    updated++;
  }
  return updated;
}

export async function syncTeamStatisticsForToday(
  pb: Pb,
  leagueId: string,
  season: string,
  teamCodes: string[],
): Promise<number> {
  if (!teamCodes.length) return 0;

  const refs = await loadPbTeamRefs(pb);
  const targets = refs.filter((r) => teamCodes.includes(r.team.code) && r.team.apiTeamId);
  let updated = 0;

  for (const { record, team } of targets) {
    if (!team.apiTeamId) continue;
    try {
      const res = (await apiFootball.teamStatistics({
        league: leagueId,
        season,
        team: team.apiTeamId,
      })) as ApiListResponse<ApiTeamStatistics>;

      const stats = res.response;
      if (!stats) continue;

      const played = stats.fixtures?.played?.total ?? 0;
      const gf = stats.goals?.for?.total?.total ?? team.gf;
      const ga = stats.goals?.against?.total?.total ?? team.ga;
      const avgFor = parseFloat(stats.goals?.for?.average?.total ?? "0");
      const form = formFromApiString(stats.form);

      await pb.collection(COLLECTIONS.teams).update(record.id, {
        gf: gf ?? team.gf,
        ga: ga ?? team.ga,
        xg: avgFor > 0 ? Math.round(avgFor * 10) / 10 : estimateXg(gf ?? team.gf, played, team.xg),
        ...(form.length ? { form } : {}),
        lastUpdated: new Date().toISOString(),
      });
      updated++;
    } catch (e) {
      console.warn(`  team statistics skipped for ${team.code}:`, e);
    }
  }
  return updated;
}

export async function syncInjuriesToNews(pb: Pb, leagueId: string, season: string): Promise<number> {
  const refs = await loadPbTeamRefs(pb);
  const pbTeams = refs.map((r) => r.team);

  const res = (await apiFootball.injuries({ league: leagueId, season })) as ApiListResponse<ApiInjuryItem[]>;
  const injuries = res.response ?? [];

  const existingNews = await pb.collection(COLLECTIONS.news).getFullList();
  for (const n of existingNews) {
    if (n.icon === API_NEWS_ICON) {
      await pb.collection(COLLECTIONS.news).delete(n.id);
    }
  }

  let count = 0;
  for (const item of injuries) {
    const teamCode = resolveTeamCode(item.team, pbTeams);
    if (!teamCode) continue;

    const sev = injurySeverity(item.reason, item.type);
    const isSuspension = /suspension|suspended|red card|ban/i.test(`${item.type} ${item.reason}`);
    const title = `${item.player.name} — ${item.reason || item.type}`;

    await pb.collection(COLLECTIONS.news).create({
      type: isSuspension ? "suspension" : "injury",
      sev,
      teamCode,
      title,
      timeLabel: "Today",
      impact: sev === "high" ? "High squad impact" : sev === "med" ? "Monitor availability" : "Minor concern",
      body: item.reason || item.type,
      icon: API_NEWS_ICON,
    });
    count++;
  }
  return count;
}

export async function syncTodayTeamCodes(pb: Pb): Promise<string[]> {
  const matches = await pb.collection(COLLECTIONS.matches).getFullList();
  const codes = new Set<string>();

  for (const m of matches) {
    if (!m.kickoffAt || !isToday(m.kickoffAt)) continue;
    if (m.homeCode) codes.add(m.homeCode);
    if (m.awayCode) codes.add(m.awayCode);
  }
  return [...codes];
}
