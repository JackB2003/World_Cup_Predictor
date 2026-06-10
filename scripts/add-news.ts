import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

const USAGE = `Usage:
  npm run news:add -- --player "Jude Bellingham" --team ENG --injury "knee knock" [--sev high|med|low] [--type injury|suspension]
  npm run news:add -- --title "Custom title" --team ARG --body "Body text" [--sev med] [--type news]

Flags:
  --player   Player name (used to build title for injury/suspension)
  --team     Team code (3-letter, e.g. ENG)
  --injury   Injury description (e.g. "hamstring", "suspended")
  --title    Override full title (optional if --player + --injury provided)
  --body     Detail text (optional, defaults to injury description)
  --sev      high | med | low  (default: med)
  --type     injury | suspension | news  (default: injury)
`;

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const player = get("--player");
  const team = get("--team");
  const injury = get("--injury");
  const titleArg = get("--title");
  const bodyArg = get("--body");
  const sev = (get("--sev") ?? "med") as "high" | "med" | "low";
  const type = (get("--type") ?? "injury") as "injury" | "suspension" | "news";

  if (!team) {
    console.error("Error: --team is required\n" + USAGE);
    process.exit(1);
  }

  if (!player && !titleArg) {
    console.error("Error: --player or --title is required\n" + USAGE);
    process.exit(1);
  }

  const title = titleArg ?? `${player} — ${injury ?? type}`;
  const body = bodyArg ?? injury ?? type;
  const impactMap: Record<string, string> = {
    high: "High squad impact",
    med: "Monitor availability",
    low: "Minor concern",
  };
  const iconMap: Record<string, string> = {
    injury: "cross",
    suspension: "card",
    news: "info",
  };

  const pb = await ensureAdminAuth();
  const record = await pb.collection(COLLECTIONS.news).create({
    type,
    sev,
    teamCode: team.toUpperCase(),
    title,
    timeLabel: "Pre-tournament",
    impact: impactMap[sev],
    body,
    icon: iconMap[type] ?? "info",
  });

  console.log(`Added [${sev.toUpperCase()}] ${title} (${team.toUpperCase()}) — id: ${record.id}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
