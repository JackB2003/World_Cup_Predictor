import { ensureAdminAuth, getPublicPocketBase } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { assertValidMatchId, pbFieldEquals } from "@/lib/pocketbase/filter-utils";
import {
  type DailyPickChoice,
  type DailyPickRecord,
  isPickLocked,
  resolvePick,
} from "@/features/picks/daily-picks";

type Pb = Awaited<ReturnType<typeof ensureAdminAuth>>;

type MatchRow = {
  matchId: string;
  homeCode: string;
  awayCode: string;
  kickoffAt?: string;
};

type PickRow = {
  id: string;
  matchId: string;
  choice: DailyPickChoice;
  pickTeam: string;
  pickLabel: string;
  kickoffAt: string;
  submittedAt: string;
};

function mapPickRow(row: PickRow): DailyPickRecord {
  return {
    matchId: row.matchId,
    choice: row.choice,
    pickTeam: row.pickTeam,
    pickLabel: row.pickLabel,
    kickoffAt: row.kickoffAt,
    submittedAt: row.submittedAt,
    locked: isPickLocked(row.kickoffAt),
  };
}

export async function getDailyPicks(matchIds?: string[]): Promise<DailyPickRecord[]> {
  matchIds?.forEach(assertValidMatchId);
  const pb = getPublicPocketBase();
  const filter = matchIds?.length
    ? matchIds.map((id) => pbFieldEquals("matchId", id)).join(" || ")
    : "";
  const rows = await pb.collection(COLLECTIONS.userDailyPicks).getFullList({
    ...(filter ? { filter } : {}),
    sort: "kickoffAt",
  });
  return rows.map((r) => mapPickRow(r as unknown as PickRow));
}

async function getMatchForPick(pb: Pb, matchId: string): Promise<MatchRow | null> {
  assertValidMatchId(matchId);
  const rows = await pb.collection(COLLECTIONS.matches).getFullList({
    filter: pbFieldEquals("matchId", matchId),
  });
  if (!rows[0]) return null;
  const m = rows[0];
  return {
    matchId: m.matchId,
    homeCode: m.homeCode,
    awayCode: m.awayCode,
    kickoffAt: m.kickoffAt,
  };
}

export async function submitDailyPick(
  matchId: string,
  choice: DailyPickChoice,
  teamNames: Record<string, string>,
): Promise<DailyPickRecord> {
  assertValidMatchId(matchId);
  const pb = await ensureAdminAuth();
  const match = await getMatchForPick(pb, matchId);
  if (!match) throw new Error(`Match not found: ${matchId}`);
  if (!match.kickoffAt) throw new Error(`Match ${matchId} has no kickoff time`);
  if (isPickLocked(match.kickoffAt)) {
    throw new Error("Picks lock at kickoff — this match has already started");
  }

  const { pickTeam, pickLabel } = resolvePick(choice, match.homeCode, match.awayCode, teamNames);
  const submittedAt = new Date().toISOString();
  const payload = {
    matchId,
    choice,
    pickTeam,
    pickLabel,
    kickoffAt: match.kickoffAt,
    submittedAt,
  };

  const existing = await pb.collection(COLLECTIONS.userDailyPicks).getFullList({
    filter: pbFieldEquals("matchId", matchId),
  });

  if (existing[0]) {
    await pb.collection(COLLECTIONS.userDailyPicks).update(existing[0].id, payload);
  } else {
    await pb.collection(COLLECTIONS.userDailyPicks).create(payload);
  }

  return {
    ...payload,
    locked: isPickLocked(match.kickoffAt),
  };
}
