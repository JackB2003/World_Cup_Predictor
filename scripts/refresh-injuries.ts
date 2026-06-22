/**
 * Daily injury refresh using OpenAI web search.
 * Replaces all manual injury/suspension news with the latest tournament status.
 * Run: npm run refresh:injuries
 */
import OpenAI from "openai";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { runScript } from "@/lib/scripts/run-script";

const MANUAL_ICON = "cross";
const SUSPENSION_ICON = "card";

// All 48 FIFA World Cup 2026 team codes — used to filter out hallucinated entries
const WC2026_TEAMS = new Set([
  "USA","CAN","MEX","ARG","BRA","URU","COL","PAR","ECU","BOL","PER","VEN",
  "ESP","FRA","ENG","GER","POR","NED","BEL","ITA","SUI","CRO","AUT","POL",
  "DEN","SWE","NOR","SCO","TUR","CZE","SRB","SVK","SVN","ALB","UKR","GEO",
  "MAR","SEN","NGA","CMR","CIV","EGY","RSA","TUN","CPV","ALG","COD",
  "JPN","KOR","AUS","IRN","SAU","QAT","IRQ","JOR","UZB","THA","NZL",
  "HAI","PAN","CUW","BIH",
]);

interface InjuryEntry {
  player: string;
  team: string;    // 3-letter code e.g. BRA
  injury: string;  // short description
  sev: "high" | "med" | "low";
  type: "injury" | "suspension";
}

async function fetchCurrentInjuries(): Promise<InjuryEntry[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: `Search for the latest FIFA World Cup 2026 injury and suspension news as of today. Check ESPN, BBC Sport, Sky Sports, and FIFA.com for the most current injury tracker and player status updates.

Return ONLY a raw JSON array (absolutely no markdown fences, no explanation, just the JSON). Include all notable injuries and suspensions from the tournament — both players who are definitively ruled out for the whole tournament AND players with limited availability or match-by-match doubts.

Each entry must have exactly these fields:
- player: full player name (string)
- team: 3-letter FIFA team code (string, e.g. "BRA", "ESP", "NED", "JPN", "CAN")
- injury: short description of injury and current status (string, max 90 chars)
- sev: "high" if ruled out or major doubt for multiple games, "med" if limited/doubtful for next game, "low" if minor concern (string)
- type: "injury" or "suspension" (string)

Known confirmed absences to include:
- Rodrygo (BRA) — ACL tear, tournament ruled out
- Jurrien Timber (NED) — groin, tournament ruled out
- Hugo Ekitike (FRA) — ruptured Achilles, tournament ruled out
- Xavi Simons (NED) — ACL, tournament ruled out
- Kaoru Mitoma (JPN) — hamstring, tournament ruled out

Also search for any NEW injuries that occurred during group stage matches so far. Aim for 10-20 total entries covering the most impactful absences and doubts. Only include teams that are actually at the 2026 World Cup.`,
  });

  const text = response.output_text?.trim() ?? "";

  // Strip markdown code fences if present
  const json = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let entries: InjuryEntry[];
  try {
    entries = JSON.parse(json);
  } catch {
    throw new Error(`OpenAI returned unparseable response:\n${text.slice(0, 500)}`);
  }

  if (!Array.isArray(entries)) throw new Error("Expected JSON array from OpenAI");

  // Filter out entries with unknown team codes to catch hallucinations
  const valid = entries.filter((e) => {
    const code = e.team?.toUpperCase();
    if (!WC2026_TEAMS.has(code)) {
      console.warn(`  Skipping unknown team code: ${e.team} (${e.player})`);
      return false;
    }
    return true;
  });

  return valid;
}

async function clearManualInjuryNews(pb: Awaited<ReturnType<typeof ensureAdminAuth>>): Promise<number> {
  const existing = await pb.collection(COLLECTIONS.news).getFullList({
    filter: `icon = "${MANUAL_ICON}" || icon = "${SUSPENSION_ICON}"`,
  });
  for (const n of existing) await pb.collection(COLLECTIONS.news).delete(n.id);
  return existing.length;
}

async function writeInjuries(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  entries: InjuryEntry[],
): Promise<number> {
  const impactMap = { high: "High squad impact", med: "Monitor availability", low: "Minor concern" };
  const iconMap = { injury: MANUAL_ICON, suspension: SUSPENSION_ICON };

  let count = 0;
  for (const e of entries) {
    const type = e.type === "suspension" ? "suspension" : "injury";
    await pb.collection(COLLECTIONS.news).create({
      type,
      sev: e.sev,
      teamCode: e.team.toUpperCase(),
      title: `${e.player} — ${e.injury}`,
      timeLabel: "Tournament",
      impact: impactMap[e.sev] ?? "Monitor availability",
      body: e.injury,
      icon: iconMap[type],
    });
    count++;
  }
  return count;
}

async function main() {
  const pb = await ensureAdminAuth();

  console.log("Fetching current World Cup 2026 injury news via OpenAI web search...");
  const entries = await fetchCurrentInjuries();
  console.log(`  Found ${entries.length} injury/suspension entries`);

  const cleared = await clearManualInjuryNews(pb);
  console.log(`  Cleared ${cleared} existing manual injury records`);

  const written = await writeInjuries(pb, entries);
  console.log(`  Written ${written} injury/suspension alert(s) to news`);

  entries.forEach((e) =>
    console.log(`  [${e.sev.toUpperCase()}] ${e.player} (${e.team}) — ${e.injury}`)
  );
}

runScript(main);
