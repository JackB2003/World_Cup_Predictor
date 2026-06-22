import { apiFootball } from "@/lib/api-football/client";
import type { ApiTopScorerEntry } from "@/lib/api-football/types";
import { resolveTeamCode } from "@/lib/api-football/team-codes";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

const TOP_N = 15;
const BASELINE_G90 = 0.3;

function normalizePos(apiPos: string): string {
  const p = (apiPos ?? "").toLowerCase();
  if (p.includes("attack") || p.includes("forward")) return "FWD";
  if (p.includes("midfield")) return "MID";
  if (p.includes("defend")) return "DEF";
  return "FWD";
}

async function main() {
  console.log("Importing top scorers from API-Football...");

  const pb = await ensureAdminAuth();

  const teamsRaw = await pb.collection(COLLECTIONS.teams).getFullList();
  const pbTeams = teamsRaw.map((t: Record<string, unknown>) => ({
    code: t.code as string,
    name: t.name as string,
    apiTeamId: t.apiTeamId as number | undefined,
  }));

  const leagueId = process.env.WORLD_CUP_LEAGUE_ID ?? "1";
  const season = process.env.WORLD_CUP_SEASON ?? "2026";

  const data = await apiFootball.topScorers({ league: leagueId, season }) as {
    response?: ApiTopScorerEntry[];
  };

  const entries = data.response ?? [];
  if (!entries.length) {
    console.log("No top scorer data returned — tournament may not have started.");
    return;
  }

  console.log(`Got ${entries.length} entries. Processing top ${TOP_N}...`);

  let updated = 0;
  let created = 0;

  for (const entry of entries.slice(0, TOP_N)) {
    const stat = entry.statistics[0];
    if (!stat) continue;

    const goals = stat.goals.total ?? 0;
    const minutes = stat.games.minutes ?? 0;
    const appearances = stat.games.appearences ?? 0;
    const penGoals = stat.penalty.scored ?? 0;

    const teamCode = resolveTeamCode(stat.team, pbTeams);
    if (!teamCode) {
      console.warn(`  Skipping ${entry.player.name} — could not resolve team: ${stat.team.name}`);
      continue;
    }

    const playerName = entry.player.name;
    const pos = normalizePos(entry.player.position ?? "Attacker");
    const liveG90 = minutes > 0 ? goals / (minutes / 90) : 0;

    const existing = await pb.collection(COLLECTIONS.scorers).getFullList({
      filter: `player = "${playerName.replace(/"/g, '\\"')}"`,
    });

    if (existing[0]) {
      const historicalG90 = (existing[0].g90 as number) ?? BASELINE_G90;
      // Blend live rate into historical: weight grows with appearances, capped at 50%
      const blendWeight = Math.min(0.5, appearances * 0.15);
      const blendedG90 = appearances > 0
        ? (1 - blendWeight) * historicalG90 + blendWeight * liveG90
        : historicalG90;

      await pb.collection(COLLECTIONS.scorers).update(existing[0].id, {
        goals,
        gamesPlayed: appearances,
        teamCode,
        pens: penGoals > 0 || (existing[0].pens as boolean),
        ...(appearances > 0 ? { g90: Math.round(blendedG90 * 1000) / 1000 } : {}),
      });
      console.log(`  ~ ${playerName} (${teamCode}) — ${goals} goals`);
      updated++;
    } else {
      // New player: anchor live rate toward baseline so one hot game doesn't inflate projection
      const smoothedG90 = appearances > 0
        ? liveG90 * 0.4 + BASELINE_G90 * 0.6
        : BASELINE_G90;
      const avgMinutes = appearances > 0 ? Math.round(minutes / appearances) : 80;

      await pb.collection(COLLECTIONS.scorers).create({
        player: playerName,
        teamCode,
        position: pos,
        goals,
        gamesPlayed: appearances,
        g90: Math.round(smoothedG90 * 1000) / 1000,
        pens: penGoals > 0,
        minutes: avgMinutes,
        proj: goals,
        prob: 0,
        conf: 65,
        trend: 0,
        note: `${stat.team.name} · ${pos}`,
        injuryRisk: "Low",
      });
      console.log(`  + Added ${playerName} (${teamCode}) — ${goals} goals`);
      created++;
    }
  }

  console.log(`Done. Updated: ${updated}, Created: ${created}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
