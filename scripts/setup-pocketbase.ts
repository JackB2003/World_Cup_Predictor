/**
 * Creates PocketBase collections for the World Cup Predictor MVP.
 * Run: npm run setup:pb
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { setupPocketBaseCollections } from "@/lib/pocketbase/collection-setup";
import { runScript } from "@/lib/scripts/run-script";

async function main() {
  const pb = await ensureAdminAuth();
  console.log("Setting up PocketBase collections...");
  await setupPocketBaseCollections(pb);
  console.log("Done.");
}

runScript(main);
