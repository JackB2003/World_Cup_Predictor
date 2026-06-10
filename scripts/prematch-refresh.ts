import { execSync } from "child_process";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { syncInjuriesForTodayFixtures } from "@/lib/api-football/sync";
import { getApiUsageToday } from "@/lib/api-football/client";
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

  try {
    execSync("npm run import:api-football", { stdio: "inherit" });
    execSync("npm run import:team-data", { stdio: "inherit" });
    execSync("npm run import:elo-ratings", { stdio: "inherit" });
    const fixtureInjuries = await syncInjuriesForTodayFixtures(pb);
    console.log(`  Refreshed ${fixtureInjuries} injury alert(s) from today's fixtures`);
  } catch (e) {
    console.warn("Pre-match data import skipped:", e);
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
