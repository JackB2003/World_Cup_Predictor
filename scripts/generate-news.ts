import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";
import { mapTeamRecord } from "@/lib/pocketbase/mappers";
import type { Team, FormResult } from "@/types/world-cup";

const WINDOW_MS = 7 * 24 * 3600 * 1000;

async function getUpcomingTeamCodes(pb: Awaited<ReturnType<typeof ensureAdminAuth>>): Promise<Set<string>> {
  const cutoff = new Date(Date.now() + WINDOW_MS).toISOString();
  const matches = await pb.collection(COLLECTIONS.matches).getFullList({
    filter: `kickoffAt >= "${new Date().toISOString()}" && kickoffAt <= "${cutoff}"`,
  });
  const codes = new Set<string>();
  matches.forEach((m) => {
    if (m.homeCode) codes.add(m.homeCode);
    if (m.awayCode) codes.add(m.awayCode);
  });
  return codes;
}

function streakInfo(form: FormResult[]): { type: FormResult; length: number } | null {
  if (!form.length) return null;
  const last = form[form.length - 1];
  let len = 0;
  for (let i = form.length - 1; i >= 0 && form[i] === last; i--) len++;
  return { type: last, length: len };
}

function generateFormAlerts(teams: Team[], upcomingCodes: Set<string>) {
  const alerts = [];
  for (const team of teams) {
    if (!upcomingCodes.has(team.code)) continue;
    const form = team.form ?? [];
    if (form.length < 3) continue;
    const last5 = form.slice(-5);
    const wins = last5.filter((f) => f === "W").length;
    const losses = last5.filter((f) => f === "L").length;
    const streak = streakInfo(last5);

    if (streak && streak.type === "W" && streak.length >= 3) {
      alerts.push({
        type: "form",
        sev: streak.length >= 5 ? "high" : "med",
        teamCode: team.code,
        title: `${team.name} — ${streak.length}-game winning run into tournament`,
        timeLabel: "Pre-tournament",
        impact: `Momentum: +${(streak.length * 1.5).toFixed(0)}% model confidence`,
        body: `${streak.length} straight wins heading into the World Cup. Form: ${last5.join(" ")}`,
        icon: "trend",
      });
    } else if (streak && streak.type === "L" && streak.length >= 2) {
      alerts.push({
        type: "form",
        sev: streak.length >= 3 ? "high" : "med",
        teamCode: team.code,
        title: `${team.name} — poor run (${streak.length} straight defeats)`,
        timeLabel: "Pre-tournament",
        impact: "Caution on predictions",
        body: `${streak.length} consecutive losses heading in. Form: ${last5.join(" ")}`,
        icon: "alert",
      });
    } else if (wins >= 4) {
      alerts.push({
        type: "form",
        sev: "med",
        teamCode: team.code,
        title: `${team.name} — strong pre-tournament form`,
        timeLabel: "Pre-tournament",
        impact: "+2% model confidence",
        body: `Won ${wins} of last 5 matches. Form: ${last5.join(" ")}`,
        icon: "trend",
      });
    } else if (losses >= 3 && wins <= 1) {
      alerts.push({
        type: "form",
        sev: "med",
        teamCode: team.code,
        title: `${team.name} — concerning form heading in`,
        timeLabel: "Pre-tournament",
        impact: "Worth monitoring",
        body: `Only ${wins} win in last 5. Form: ${last5.join(" ")}`,
        icon: "alert",
      });
    }
  }
  return alerts;
}

async function generateOddsAlerts(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  teams: Team[],
  upcomingCodes: Set<string>
) {
  const teamMap = Object.fromEntries(teams.map((t) => [t.code, t]));
  const cutoff = new Date(Date.now() + WINDOW_MS).toISOString();
  const matches = await pb.collection(COLLECTIONS.matches).getFullList({
    filter: `kickoffAt >= "${new Date().toISOString()}" && kickoffAt <= "${cutoff}"`,
    sort: "kickoffAt",
  });

  const oddsRaw = await pb.collection("match_odds").getFullList();
  const oddsMap = new Map(oddsRaw.map((o) => [o.matchId, o]));

  const predictions = await pb.collection(COLLECTIONS.predictions).getFullList();
  const predMap = new Map(predictions.map((p) => [p.matchId, p]));

  const alerts = [];
  for (const match of matches) {
    if (!upcomingCodes.has(match.homeCode) && !upcomingCodes.has(match.awayCode)) continue;
    const odds = oddsMap.get(match.matchId);
    if (!odds) continue;

    const home = teamMap[match.homeCode];
    const away = teamMap[match.awayCode];
    if (!home || !away) continue;

    const pred = predMap.get(match.matchId);
    const marketHome = Math.round(odds.oddsHome * 100);
    const marketAway = Math.round(odds.oddsAway * 100);
    const marketDraw = Math.round(odds.oddsDraw * 100);

    if (pred) {
      const modelHome = pred.winHome ?? 0;
      const modelAway = pred.winAway ?? 0;
      const diff = Math.abs(marketHome - modelHome);
      if (diff >= 12) {
        const marketFavours = marketHome > marketAway ? home.name : away.name;
        const modelFavours = modelHome > modelAway ? home.name : away.name;
        if (marketFavours !== modelFavours) {
          alerts.push({
            type: "odds",
            sev: diff >= 20 ? "high" : "med",
            teamCode: match.homeCode,
            title: `Market vs Model disagreement: ${home.name} v ${away.name}`,
            timeLabel: "Match odds",
            impact: `${diff}pp model/market gap`,
            body: `Market backs ${marketFavours} (${Math.max(marketHome, marketAway)}%) but model favours ${modelFavours} (${Math.max(modelHome, modelAway)}%). Significant divergence.`,
            icon: "trend",
          });
          continue;
        }
      }
    }

    // Heavy favourite alert
    const maxMarket = Math.max(marketHome, marketAway);
    if (maxMarket >= 60) {
      const favCode = marketHome >= marketAway ? match.homeCode : match.awayCode;
      const favTeam = teamMap[favCode];
      const dogTeam = favCode === match.homeCode ? away : home;
      if (favTeam && dogTeam) {
        alerts.push({
          type: "odds",
          sev: "low",
          teamCode: favCode,
          title: `${favTeam.name} strong favourite vs ${dogTeam.name}`,
          timeLabel: "Match odds",
          impact: `Market: ${maxMarket}% win probability`,
          body: `Odds: ${home.name} ${marketHome}% / Draw ${marketDraw}% / ${away.name} ${marketAway}%. ${favTeam.name} heavy favourite.`,
          icon: "trend",
        });
      }
    }
  }
  return alerts;
}

async function main() {
  const pb = await ensureAdminAuth();

  const teamsRaw = await pb.collection(COLLECTIONS.teams).getFullList();
  const teams = teamsRaw.map(mapTeamRecord);
  const upcomingCodes = await getUpcomingTeamCodes(pb);

  console.log(`Upcoming teams (7-day window): ${upcomingCodes.size}`);

  // Clear old auto-generated news
  const existing = await pb.collection(COLLECTIONS.news).getFullList({
    filter: 'type = "form" || type = "odds"',
  });
  for (const n of existing) await pb.collection(COLLECTIONS.news).delete(n.id);
  console.log(`  Cleared ${existing.length} old form/odds alerts`);

  const formAlerts = generateFormAlerts(teams, upcomingCodes);
  for (const a of formAlerts) await pb.collection(COLLECTIONS.news).create(a);
  console.log(`  Generated ${formAlerts.length} form alert(s)`);

  const oddsAlerts = await generateOddsAlerts(pb, teams, upcomingCodes);
  for (const a of oddsAlerts) await pb.collection(COLLECTIONS.news).create(a);
  console.log(`  Generated ${oddsAlerts.length} odds alert(s)`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
