import { execSync } from "child_process";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { apiFootball, getApiUsageToday } from "@/lib/api-football/client";
import { isToday } from "@/lib/utils";

async function main() {
  const pb = await ensureAdminAuth();
  const matches = await pb.collection(COLLECTIONS.matches).getFullList();
  const todayMatches = matches.filter((m) => m.kickoffAt && isToday(m.kickoffAt));

  if (!todayMatches.length) {
    console.log("No matches today — skipping pre-match refresh.");
    return;
  }

  const started = new Date().toISOString();
  const usageBefore = await getApiUsageToday();

  if (process.env.API_FOOTBALL_MOCK !== "true") {
    const leagueId = process.env.WORLD_CUP_LEAGUE_ID ?? "1";
    const season = process.env.WORLD_CUP_SEASON ?? "2026";
    try {
      await apiFootball.injuries({ league: leagueId, season });
      await apiFootball.fixtures({ league: leagueId, season, date: new Date().toISOString().slice(0, 10) });
    } catch (e) {
      console.warn("Pre-match API pull skipped:", e);
    }
  }

  execSync("npm run predict:today", { stdio: "inherit" });

  const usageAfter = await getApiUsageToday();
  await pb.collection(COLLECTIONS.dataRefreshLogs).create({
    refreshType: "prematch",
    startedAt: started,
    completedAt: new Date().toISOString(),
    recordsUpdated: todayMatches.length,
    errors: "",
    requestCount: usageAfter.used - usageBefore.used,
  });

  console.log("Pre-match refresh complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
