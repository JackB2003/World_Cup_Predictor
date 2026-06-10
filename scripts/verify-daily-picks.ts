/**
 * Pre-flight check for Jack's daily pick flow.
 * Run: npm run picks:verify
 */
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { getDailyPicks, submitDailyPick } from "@/lib/picks/store";
import { isPickLocked } from "@/features/picks/daily-picks";

const FINISHED = new Set(["FT", "AET", "PEN"]);

async function main() {
  console.log("=== Jack's Daily Picks — Pre-flight Check ===\n");
  let ok = true;

  if (!process.env.POCKETBASE_URL) {
    console.error("✗ POCKETBASE_URL is not set");
    process.exit(1);
  }
  console.log("✓ POCKETBASE_URL configured");

  let pb: Awaited<ReturnType<typeof ensureAdminAuth>>;
  try {
    pb = await ensureAdminAuth();
    console.log("✓ PocketBase admin auth OK");
  } catch (e) {
    console.error("✗ PocketBase auth failed:", e);
    process.exit(1);
  }

  try {
    await pb.collections.getOne(COLLECTIONS.userDailyPicks);
    console.log("✓ user_daily_picks collection exists");
  } catch {
    console.error("✗ user_daily_picks collection missing — run: npm run setup:pb");
    ok = false;
  }

  const now = Date.now();
  const matches = await pb.collection(COLLECTIONS.matches).getFullList({ sort: "kickoffAt" });
  const upcoming = matches.filter(
    (m) => m.kickoffAt && new Date(m.kickoffAt).getTime() > now && !FINISHED.has(m.status ?? ""),
  );
  const finished = matches.filter((m) => FINISHED.has(m.status ?? ""));

  console.log(`\nMatches in database: ${matches.length}`);
  console.log(`  Upcoming (pickable): ${upcoming.length}`);
  console.log(`  Finished (gradable): ${finished.length}`);

  if (upcoming.length === 0) {
    console.log("\n⚠ No upcoming matches yet — normal if no games today.");
    console.log("  Tomorrow: after morning refresh, run this again to confirm fixtures loaded.");
  } else {
    console.log("\nUpcoming fixtures:");
    for (const m of upcoming.slice(0, 8)) {
      console.log(`  · ${m.matchId}: ${m.homeCode} vs ${m.awayCode} @ ${m.kickoffAt}`);
    }
  }

  const existingPicks = await getDailyPicks();
  const pending = existingPicks.filter((p) => !p.locked);
  console.log(`\nYour saved picks: ${existingPicks.length} (${pending.length} still editable)`);

  if (upcoming.length > 0) {
    const testMatch = upcoming[0];
    const testId = `verify-${Date.now()}`;
    const original = await pb.collection(COLLECTIONS.userDailyPicks).getFullList({
      filter: `matchId = "${testMatch.matchId}"`,
    });

    try {
      const saved = await submitDailyPick(testMatch.matchId, "home", {
        [testMatch.homeCode]: testMatch.homeCode,
        [testMatch.awayCode]: testMatch.awayCode,
      });
      const loaded = await getDailyPicks([testMatch.matchId]);
      if (loaded[0]?.pickLabel === saved.pickLabel) {
        console.log(`✓ Pick save/read round-trip OK (${testMatch.matchId})`);
      } else {
        console.error("✗ Pick round-trip failed — saved pick does not match loaded pick");
        ok = false;
      }

      if (original[0]) {
        await pb.collection(COLLECTIONS.userDailyPicks).update(original[0].id, {
          choice: original[0].choice,
          pickTeam: original[0].pickTeam,
          pickLabel: original[0].pickLabel,
          submittedAt: original[0].submittedAt,
        });
        console.log("  (restored your existing pick for that match)");
      } else {
        await pb.collection(COLLECTIONS.userDailyPicks).getFullList({
          filter: `matchId = "${testMatch.matchId}"`,
        }).then(async (rows) => {
          if (rows[0]) await pb.collection(COLLECTIONS.userDailyPicks).delete(rows[0].id);
        });
        console.log("  (removed temporary test pick)");
      }
    } catch (e) {
      console.error("✗ Pick save/read test failed:", e);
      ok = false;
    }

    void testId;
  }

  const pastMatch = matches.find((m) => m.kickoffAt && isPickLocked(m.kickoffAt));
  if (pastMatch) {
    try {
      await submitDailyPick(pastMatch.matchId, "home", {
        [pastMatch.homeCode]: pastMatch.homeCode,
      });
      console.error("✗ Kickoff lock failed — was able to pick a started/finished match");
      ok = false;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("lock") || msg.includes("started")) {
        console.log("✓ Kickoff lock enforced on past matches");
      } else {
        console.error("✗ Unexpected lock error:", e);
        ok = false;
      }
    }
  }

  console.log("\n--- Tomorrow morning checklist ---");
  console.log("1. Morning refresh runs (6am cron or manual Refresh in app)");
  console.log("2. Open Today's Picks — each match shows Jack's pick buttons");
  console.log("3. Select Home Win / Draw / Away Win before kickoff");
  console.log("4. After matches finish, run: npm run grade:picks");
  console.log("5. Check Jack's Pick Tracker for results (coming in next UI pass)");

  if (!ok) {
    console.log("\n✗ Pre-flight check FAILED — fix issues above before tomorrow.");
    process.exit(1);
  }
  console.log("\n✓ Pre-flight check passed — ready for tomorrow's picks.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
