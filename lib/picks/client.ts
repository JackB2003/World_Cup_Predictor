import { basePath } from "@/lib/base-path";
import { isPickLocked, resolvePick } from "@/features/picks/daily-picks";
import type { DailyPick, DailyPickChoice } from "@/types/world-cup";

const STORAGE_KEY = "jack-daily-picks-v1";

function readLocalPicks(): Record<string, DailyPick> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, DailyPick>;
  } catch {
    return {};
  }
}

function writeLocalPick(pick: DailyPick) {
  const all = readLocalPicks();
  all[pick.matchId] = pick;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function fetchDailyPicks(matchIds: string[]): Promise<{
  picks: DailyPick[];
  source: "pocketbase" | "local" | "unavailable";
}> {
  if (!matchIds.length) return { picks: [], source: "unavailable" };

  try {
    const res = await fetch(`${basePath}/api/picks?matchIds=${matchIds.join(",")}`);
    const data = await res.json();
    if (res.ok && data.source === "pocketbase") {
      return { picks: data.picks as DailyPick[], source: "pocketbase" };
    }
  } catch {
    // fall through to local storage
  }

  const local = readLocalPicks();
  const picks = matchIds.map((id) => local[id]).filter(Boolean);
  return { picks, source: picks.length ? "local" : "unavailable" };
}

export async function saveDailyPick(
  matchId: string,
  choice: DailyPickChoice,
  homeCode: string,
  awayCode: string,
  kickoffAt: string | undefined,
  teamNames: Record<string, string>,
): Promise<{ pick: DailyPick; source: "pocketbase" | "local" }> {
  try {
    const res = await fetch(`${basePath}/api/picks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, choice, teamNames }),
    });
    const data = await res.json();
    if (res.ok && data.pick) {
      return { pick: data.pick as DailyPick, source: "pocketbase" };
    }
    if (res.status === 403) throw new Error(data.error ?? "Pick is locked");
    if (res.status !== 503) throw new Error(data.error ?? "Failed to save pick");
  } catch (err) {
    if (err instanceof Error && (err.message.includes("lock") || err.message.includes("started"))) {
      throw err;
    }
  }

  if (isPickLocked(kickoffAt)) {
    throw new Error("Picks lock at kickoff — this match has already started");
  }

  const { pickTeam, pickLabel } = resolvePick(choice, homeCode, awayCode, teamNames);
  const pick: DailyPick = {
    matchId,
    choice,
    pickTeam,
    pickLabel,
    kickoffAt,
    submittedAt: new Date().toISOString(),
    locked: isPickLocked(kickoffAt),
  };
  writeLocalPick(pick);
  return { pick, source: "local" };
}
