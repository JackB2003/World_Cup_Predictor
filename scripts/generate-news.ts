/**
 * AI-powered news generation — runs on every cycle refresh.
 * Uses OpenAI web_search_preview to fetch:
 *   1. Current betting odds for upcoming fixtures
 *   2. Top 5 World Cup news events from last 24-48 hours
 * Replaces the old form/odds alerts that depended on unreliable API-Football data.
 * Injuries are handled separately by refresh:injuries.
 */
import OpenAI from "openai";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

const WC2026_TEAMS = new Set([
  "USA","CAN","MEX","ARG","BRA","URU","COL","PAR","ECU","BOL","PER","VEN",
  "ESP","FRA","ENG","GER","POR","NED","BEL","ITA","SUI","CRO","AUT","POL",
  "DEN","SWE","NOR","SCO","TUR","CZE","SRB","SVK","SVN","ALB","UKR","GEO",
  "MAR","SEN","NGA","CMR","CIV","EGY","RSA","TUN","CPV","ALG","COD",
  "JPN","KOR","AUS","IRN","SAU","QAT","IRQ","JOR","UZB","THA","NZL",
  "HAI","PAN","CUW","BIH",
]);

const WINDOW_MS = 7 * 24 * 3600 * 1000;

interface UpcomingMatch {
  matchId: string;
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  kickoffAt: string;
  stage: string;
}

interface OddsEntry {
  homeCode: string;
  awayCode: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  source: string;
  sev: "high" | "med" | "low";
}

interface NewsEntry {
  title: string;
  body: string;
  teamCode: string;
  sev: "high" | "med" | "low";
}

function parseJson<T>(text: string): T | null {
  // Try to extract a JSON array from anywhere in the response
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]) as T;
    } catch { /* fall through */ }
  }
  // Fallback: strip markdown fences and try the whole thing
  const cleaned = text
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.warn("  Failed to parse AI response:", text.slice(0, 300));
    return null;
  }
}

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

async function getUpcomingMatches(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>
): Promise<UpcomingMatch[]> {
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() + WINDOW_MS).toISOString();
  const matches = await pb.collection(COLLECTIONS.matches).getFullList({
    filter: `kickoffAt >= "${now}" && kickoffAt <= "${cutoff}"`,
    sort: "kickoffAt",
  });
  // Also exclude any that are already marked finished (status check as safety net)
  const filtered = matches.filter((m) => !FINISHED_STATUSES.has(m.status));
  const teamsRaw = await pb.collection(COLLECTIONS.teams).getFullList();
  const nameMap = Object.fromEntries(teamsRaw.map((t) => [t.code, t.name]));

  return filtered.map((m) => ({
    matchId: m.matchId,
    homeCode: m.homeCode,
    awayCode: m.awayCode,
    homeName: nameMap[m.homeCode] ?? m.homeCode,
    awayName: nameMap[m.awayCode] ?? m.awayCode,
    kickoffAt: m.kickoffAt ?? "",
    stage: m.stage ?? "",
  }));
}

async function fetchAiOdds(client: OpenAI, matches: UpcomingMatch[]): Promise<OddsEntry[]> {
  if (!matches.length) return [];

  const capped = matches.slice(0, 12);

  // Build a validation set of valid upcoming pairs (both orderings) so we can
  // reject AI entries that don't correspond to a real upcoming match.
  const validPairs = new Set(capped.map((m) => `${m.homeCode}:${m.awayCode}`));

  const matchList = capped
    .map((m) => {
      const date = m.kickoffAt ? m.kickoffAt.slice(0, 16).replace("T", " ") + " UTC" : "upcoming";
      return `- ${m.homeName} (${m.homeCode}) vs ${m.awayName} (${m.awayCode}) — ${date}`;
    })
    .join("\n");

  console.log(`  Fetching AI odds for ${capped.length} upcoming matches...`);

  const response = await client.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" as const }],
    input: `I need current betting market odds ONLY for these specific upcoming FIFA World Cup 2026 fixtures — do not include any other matches:\n\n${matchList}\n\nSearch Bet365, DraftKings, William Hill, or Betfair for odds on each match listed above. Return ONLY a raw JSON array with no markdown fences, no preamble, no explanation. Each element must have exactly these fields:\n- homeCode: 3-letter code exactly as shown above (e.g. "ESP")\n- awayCode: 3-letter code exactly as shown above\n- homeWin: integer 0-100 (vig-free market win probability %)\n- draw: integer 0-100\n- awayWin: integer 0-100\n- source: bookmaker name\n- sev: "high" if one team >65%, "med" if 50-65%, "low" if close\n\nOnly include matches from the list above where you found actual live odds. Return an empty array [] if you cannot find any.`,
  });

  const raw = parseJson<OddsEntry[]>(response.output_text?.trim() ?? "");
  if (!Array.isArray(raw)) return [];

  return raw.filter((e) => {
    const hc = e.homeCode?.toUpperCase();
    const ac = e.awayCode?.toUpperCase();
    // Primary gate: must match an actual upcoming match we sent to the AI
    if (!validPairs.has(`${hc}:${ac}`)) {
      console.warn(`  Rejecting odds for ${hc} vs ${ac} — not in upcoming match list`);
      return false;
    }
    const sum = (e.homeWin ?? 0) + (e.draw ?? 0) + (e.awayWin ?? 0);
    if (sum < 90 || sum > 110) {
      console.warn(`  Skipping odds that don't sum to ~100: ${hc} vs ${ac} (${sum})`);
      return false;
    }
    return true;
  }).map((e) => ({ ...e, homeCode: e.homeCode.toUpperCase(), awayCode: e.awayCode.toUpperCase() }));
}

async function fetchAiNews(client: OpenAI): Promise<NewsEntry[]> {
  console.log("  Fetching top World Cup news events via AI...");

  const response = await client.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" as const }],
    input: `Search ESPN, BBC Sport, Sky Sports, and FIFA.com for the 5 most important FIFA World Cup 2026 news stories from the last 48 hours. Focus on match results, surprise upsets, breakthrough performances, controversial decisions, or major tournament developments.\n\nReturn ONLY a raw JSON array with no markdown fences, no preamble, no explanation — just the array. Each element must have exactly these fields:\n- title: short punchy headline, max 80 characters\n- body: 1-2 sentence summary of the story, max 160 characters\n- teamCode: 3-letter FIFA code of the most relevant team (e.g. "BRA", "FRA", "USA"). Must be a real participating team code — never use "FIFA", "WC", or tournament names as a code.\n- sev: "high" for major story (upset, injury to star, key result), "med" for notable news, "low" for minor updates\n\nReturn exactly 5 entries ordered by importance.`,
  });

  const raw = parseJson<NewsEntry[]>(response.output_text?.trim() ?? "");
  if (!Array.isArray(raw)) return [];

  return raw.filter((e) => {
    const code = e.teamCode?.toUpperCase();
    if (!WC2026_TEAMS.has(code)) {
      console.warn(`  Skipping news entry with unknown team: ${e.teamCode}`);
      return false;
    }
    return typeof e.title === "string" && typeof e.body === "string";
  }).map((e) => ({ ...e, teamCode: e.teamCode.toUpperCase() }));
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });
  const pb = await ensureAdminAuth();

  // Clear old auto-generated odds + news alerts (injuries managed by refresh:injuries)
  const existing = await pb.collection(COLLECTIONS.news).getFullList({
    filter: 'type = "odds" || type = "news" || type = "form"',
  });
  for (const n of existing) await pb.collection(COLLECTIONS.news).delete(n.id);
  console.log(`Cleared ${existing.length} old auto-generated alert(s)`);

  const upcomingMatches = await getUpcomingMatches(pb);
  console.log(`Upcoming matches (7-day window): ${upcomingMatches.length}`);

  // --- Odds alerts ---
  const oddsEntries = await fetchAiOdds(client, upcomingMatches);
  const teamNameMap: Record<string, string> = Object.fromEntries(
    (await pb.collection(COLLECTIONS.teams).getFullList()).map((t) => [t.code, t.name])
  );

  for (const e of oddsEntries) {
    const homeName = teamNameMap[e.homeCode] ?? e.homeCode;
    const awayName = teamNameMap[e.awayCode] ?? e.awayCode;
    const favCode = e.homeWin >= e.awayWin ? e.homeCode : e.awayCode;
    const favName = e.homeWin >= e.awayWin ? homeName : awayName;
    const favPct = Math.max(e.homeWin, e.awayWin);

    await pb.collection(COLLECTIONS.news).create({
      type: "odds",
      sev: e.sev,
      teamCode: favCode,
      title: `${homeName} vs ${awayName} — ${favName} ${favPct}% favourite`,
      timeLabel: "Match odds",
      impact: `${homeName} ${e.homeWin}% / Draw ${e.draw}% / ${awayName} ${e.awayWin}%`,
      body: `Market (${e.source}): ${homeName} ${e.homeWin}% · Draw ${e.draw}% · ${awayName} ${e.awayWin}%.`,
      icon: "trend",
    });
  }
  console.log(`Generated ${oddsEntries.length} odds alert(s)`);

  // --- Top news events ---
  const newsEntries = await fetchAiNews(client);
  for (const e of newsEntries) {
    await pb.collection(COLLECTIONS.news).create({
      type: "news",
      sev: e.sev,
      teamCode: e.teamCode,
      title: e.title,
      timeLabel: "Latest",
      impact: e.sev === "high" ? "Major story" : e.sev === "med" ? "Notable" : "Update",
      body: e.body,
      icon: "bell",
    });
  }
  console.log(`Generated ${newsEntries.length} news event(s)`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
