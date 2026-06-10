import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { syncEloRatings } from "@/lib/elo-ratings/sync";

async function main() {
  const pb = await ensureAdminAuth();
  console.log("Importing World Football Elo ratings from eloratings.net...");

  const { updated, missing } = await syncEloRatings(pb);
  console.log(`  Updated Elo for ${updated} team(s)`);

  if (missing.length) {
    console.warn(`  No eloratings.net match for: ${missing.join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
