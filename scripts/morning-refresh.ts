import { execSync } from "child_process";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { getApiUsageToday } from "@/lib/api-football/client";

async function main() {
  const started = new Date().toISOString();
  let recordsUpdated = 0;
  let errors = "";
  let requestCount = 0;

  try {
    const usage = await getApiUsageToday();
    requestCount = usage.used;
    console.log(`API usage before refresh: ${usage.used}/${usage.limit}`);

    try {
      execSync("npm run import:api-football", { stdio: "inherit" });
      execSync("npm run import:team-data", { stdio: "inherit" });
      execSync("npm run import:elo-ratings", { stdio: "inherit" });
      recordsUpdated += 3;
    } catch (e) {
      errors += `import: ${e}; `;
    }

    execSync("npm run predict:top4", { stdio: "inherit" });
    execSync("npm run predict:scorer", { stdio: "inherit" });
    execSync("npm run predict:today", { stdio: "inherit" });
    recordsUpdated += 3;

    const after = await getApiUsageToday();
    requestCount = after.used - usage.used;

    const pb = await ensureAdminAuth();
    await pb.collection(COLLECTIONS.dataRefreshLogs).create({
      refreshType: "morning",
      startedAt: started,
      completedAt: new Date().toISOString(),
      recordsUpdated,
      errors,
      requestCount,
    });

    console.log("Morning refresh complete.");
  } catch (err) {
    errors += String(err);
    console.error(err);
    process.exit(1);
  }
}

main();
