/**
 * Imports all live data used by daily match predictions, then regenerates today's picks.
 * Run on VPS after deploy or to clear placeholder data without re-seeding.
 */
import { execSync } from "child_process";

async function main() {
  console.log("Refreshing prediction data (fixtures → teams → Elo → injuries → picks)...");

  execSync("npm run import:api-football", { stdio: "inherit" });
  execSync("npm run import:team-data", { stdio: "inherit" });
  execSync("npm run import:elo-ratings", { stdio: "inherit" });
  execSync("npm run predict:today", { stdio: "inherit" });

  console.log("Prediction data refresh complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
