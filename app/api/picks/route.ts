import { NextResponse } from "next/server";
import { getDailyPicks, submitDailyPick } from "@/lib/picks/store";
import type { DailyPickChoice } from "@/features/picks/daily-picks";

const VALID_CHOICES = new Set<DailyPickChoice>(["home", "draw", "away"]);

export async function GET(req: Request) {
  if (!process.env.POCKETBASE_URL) {
    return NextResponse.json({ picks: [], source: "unavailable" });
  }

  try {
    const { searchParams } = new URL(req.url);
    const matchIds = searchParams.get("matchIds")?.split(",").filter(Boolean);
    const picks = await getDailyPicks(matchIds);
    return NextResponse.json({ picks, source: "pocketbase" });
  } catch (err) {
    console.error("[api/picks GET]", err);
    return NextResponse.json({ error: "Failed to load picks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!process.env.POCKETBASE_URL) {
    return NextResponse.json({ error: "Picks storage unavailable (no PocketBase)" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { matchId, choice, teamNames } = body as {
      matchId?: string;
      choice?: DailyPickChoice;
      teamNames?: Record<string, string>;
    };

    if (!matchId || !choice || !VALID_CHOICES.has(choice)) {
      return NextResponse.json(
        { error: "matchId and choice (home | draw | away) are required" },
        { status: 400 },
      );
    }

    const pick = await submitDailyPick(matchId, choice, teamNames ?? {});
    return NextResponse.json({ pick });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save pick";
    const status = message.includes("lock") || message.includes("started") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
