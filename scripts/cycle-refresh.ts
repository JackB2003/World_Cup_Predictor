/**
 * 3-hour cycle refresh — replaces separate morning + prematch + grade-picks crons.
 * Runs every 3 hours via cron: 0 *\/3 * * *
 *
 * Add to your deploy user's crontab:
 *   0 *\/3 * * * cd /path/to/app && npm run refresh:cycle >> /var/log/world-cup-refresh.log 2>&1
 */
import { execSync } from "child_process";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

function run(cmd: string) {
  console.log(`\n▶ ${cmd}`);
  execSync(`npm run ${cmd}`, { stdio: "inherit" });
}

async function main() {
  const started = new Date().toISOString();
  console.log(`\n=== Cycle refresh started at ${started} ===`);

  let errors = "";

  // --- Data imports ---
  const imports = [
    "import:api-football",
    "import:team-data",
    "import:elo-ratings",
    "import:fixture-stats",
    "import:odds",
    "import:topscorers",
  ];
  for (const cmd of imports) {
    try { run(cmd); } catch (e) { errors += `${cmd}: ${e}; `; console.warn(`  skipped: ${cmd}`); }
  }

  // --- Picks grading ---
  try { run("grade:picks"); } catch (e) { errors += `grade:picks: ${e}; `; }

  // --- Predictions ---
  try { run("predict:top4"); } catch (e) { errors += `predict:top4: ${e}; `; }
  try { run("predict:scorer"); } catch (e) { errors += `predict:scorer: ${e}; `; }
  try { run("predict:today"); } catch (e) { errors += `predict:today: ${e}; `; }

  // --- News (AI web search for injuries + odds + top stories) ---
  try { run("refresh:injuries"); } catch (e) { errors += `refresh:injuries: ${e}; `; }
  try { run("news:generate"); } catch (e) { errors += `news:generate: ${e}; `; }

  const pb = await ensureAdminAuth();
  await pb.collection(COLLECTIONS.dataRefreshLogs).create({
    refreshType: "cycle",
    startedAt: started,
    completedAt: new Date().toISOString(),
    recordsUpdated: 0,
    errors,
    requestCount: 0,
  });

  console.log(`\n=== Cycle refresh complete. Errors: ${errors || "none"} ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
