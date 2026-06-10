import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { syncLineupsToNews } from "@/lib/api-football/sync";

async function main() {
  const pb = await ensureAdminAuth();
  const count = await syncLineupsToNews(pb);
  console.log(`Synced ${count} lineup announcement(s) to news`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
