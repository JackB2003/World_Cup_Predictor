import type { ensureAdminAuth } from "@/lib/pocketbase/admin";

type FieldDef = {
  name: string;
  type: string;
  required?: boolean;
  options?: Record<string, unknown>;
};

async function ensureCollection(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  name: string,
  fields: FieldDef[],
  listRule = "",
  viewRule = "",
) {
  try {
    await pb.collections.getOne(name);
    console.log(`  ✓ ${name} exists`);
    return;
  } catch {
    // create
  }

  await pb.collections.create({
    name,
    type: "base",
    fields: fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      ...(f.options ? { options: f.options } : {}),
    })),
    listRule,
    viewRule,
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  console.log(`  + created ${name}`);
}

export async function setupPocketBaseCollections(pb: Awaited<ReturnType<typeof ensureAdminAuth>>) {

  await ensureCollection(pb, "teams", [
    { name: "code", type: "text", required: true },
    { name: "name", type: "text", required: true },
    { name: "color", type: "text" },
    { name: "txt", type: "text" },
    { name: "group", type: "text" },
    { name: "elo", type: "number" },
    { name: "fifa", type: "number" },
    { name: "titleProb", type: "number" },
    { name: "top4", type: "number" },
    { name: "advance", type: "number" },
    { name: "form", type: "json" },
    { name: "gf", type: "number" },
    { name: "ga", type: "number" },
    { name: "xg", type: "number" },
    { name: "conf", type: "text" },
    { name: "trend", type: "number" },
    { name: "host", type: "bool" },
    { name: "apiTeamId", type: "number" },
    { name: "lastUpdated", type: "date" },
  ]);

  await ensureCollection(pb, "players", [
    { name: "name", type: "text", required: true },
    { name: "teamCode", type: "text", required: true },
    { name: "position", type: "text" },
    { name: "goals", type: "number" },
    { name: "assists", type: "number" },
    { name: "g90", type: "number" },
    { name: "minutes", type: "number" },
    { name: "penaltyTaker", type: "bool" },
    { name: "injuryStatus", type: "text" },
    { name: "suspensionStatus", type: "text" },
    { name: "apiPlayerId", type: "number" },
    { name: "lastUpdated", type: "date" },
  ]);

  await ensureCollection(pb, "matches", [
    { name: "matchId", type: "text", required: true },
    { name: "kickoffAt", type: "date" },
    { name: "time", type: "text" },
    { name: "venue", type: "text" },
    { name: "stage", type: "text" },
    { name: "homeCode", type: "text", required: true },
    { name: "awayCode", type: "text", required: true },
    { name: "status", type: "text" },
    { name: "scoreHome", type: "number" },
    { name: "scoreAway", type: "number" },
    { name: "apiFixtureId", type: "number" },
    { name: "lastUpdated", type: "date" },
  ]);

  await ensureCollection(pb, "standings", [
    { name: "teamCode", type: "text", required: true },
    { name: "group", type: "text" },
    { name: "played", type: "number" },
    { name: "wins", type: "number" },
    { name: "draws", type: "number" },
    { name: "losses", type: "number" },
    { name: "gf", type: "number" },
    { name: "ga", type: "number" },
    { name: "gd", type: "number" },
    { name: "points", type: "number" },
    { name: "qualification", type: "text" },
    { name: "lastUpdated", type: "date" },
  ]);

  await ensureCollection(pb, "injuries", [
    { name: "playerName", type: "text" },
    { name: "teamCode", type: "text" },
    { name: "status", type: "text" },
    { name: "impact", type: "text" },
    { name: "expectedReturn", type: "text" },
    { name: "source", type: "text" },
    { name: "sourceUrl", type: "url" },
    { name: "lastUpdated", type: "date" },
  ]);

  await ensureCollection(pb, "predictions", [
    { name: "matchId", type: "text", required: true },
    { name: "recommendedPick", type: "text" },
    { name: "pickKind", type: "text" },
    { name: "confidence", type: "number" },
    { name: "predictedScoreHome", type: "number" },
    { name: "predictedScoreAway", type: "number" },
    { name: "winHome", type: "number" },
    { name: "draw", type: "number" },
    { name: "winAway", type: "number" },
    { name: "keyReasons", type: "json" },
    { name: "riskFactors", type: "text" },
    { name: "tag", type: "text" },
    { name: "dataFreshness", type: "text" },
  ]);

  await ensureCollection(pb, "user_daily_picks", [
    { name: "matchId", type: "text", required: true },
    { name: "choice", type: "text", required: true },
    { name: "pickTeam", type: "text", required: true },
    { name: "pickLabel", type: "text", required: true },
    { name: "kickoffAt", type: "date", required: true },
    { name: "submittedAt", type: "date", required: true },
    { name: "graded", type: "bool" },
  ]);

  await ensureCollection(pb, "prediction_history", [
    { name: "matchLabel", type: "text" },
    { name: "userPick", type: "text" },
    { name: "aiPick", type: "text" },
    { name: "finalResult", type: "text" },
    { name: "wasCorrect", type: "bool" },
    { name: "pointsEarned", type: "number" },
    { name: "notes", type: "text" },
  ]);

  await ensureCollection(pb, "api_request_logs", [
    { name: "endpoint", type: "text" },
    { name: "requestTimestamp", type: "date" },
    { name: "requestsUsedToday", type: "number" },
    { name: "responseStatus", type: "number" },
    { name: "errorMessage", type: "text" },
  ]);

  await ensureCollection(pb, "data_refresh_logs", [
    { name: "refreshType", type: "text" },
    { name: "startedAt", type: "date" },
    { name: "completedAt", type: "date" },
    { name: "recordsUpdated", type: "number" },
    { name: "errors", type: "text" },
    { name: "requestCount", type: "number" },
  ]);

  await ensureCollection(pb, "api_cache", [
    { name: "cacheKey", type: "text", required: true },
    { name: "endpoint", type: "text" },
    { name: "response", type: "json" },
    { name: "fetchedAt", type: "date" },
    { name: "ttlHours", type: "number" },
  ]);

  await ensureCollection(pb, "news", [
    { name: "type", type: "text" },
    { name: "sev", type: "text" },
    { name: "teamCode", type: "text" },
    { name: "title", type: "text" },
    { name: "timeLabel", type: "text" },
    { name: "impact", type: "text" },
    { name: "body", type: "text" },
    { name: "icon", type: "text" },
  ]);

  await ensureCollection(pb, "scorers", [
    { name: "player", type: "text", required: true },
    { name: "teamCode", type: "text" },
    { name: "position", type: "text" },
    { name: "proj", type: "number" },
    { name: "prob", type: "number" },
    { name: "goals", type: "number" },
    { name: "g90", type: "number" },
    { name: "pens", type: "bool" },
    { name: "minutes", type: "number" },
    { name: "conf", type: "number" },
    { name: "trend", type: "number" },
    { name: "note", type: "text" },
    { name: "projectedMatches", type: "number" },
    { name: "groupDifficulty", type: "number" },
    { name: "injuryRisk", type: "text" },
  ]);

  await ensureCollection(pb, "user_picks", [
    { name: "points", type: "number" },
    { name: "rank", type: "number" },
    { name: "totalUsers", type: "number" },
    { name: "accuracy", type: "number" },
    { name: "streak", type: "number" },
    { name: "top4", type: "json" },
    { name: "topScorer", type: "json" },
    { name: "history", type: "json" },
    { name: "accuracyTrend", type: "json" },
  ]);

  await ensureCollection(pb, "meta", [
    { name: "key", type: "text", required: true },
    { name: "value", type: "json" },
  ]);

  await ensureCollection(pb, "tournament_predictions", [
    { name: "type", type: "text" },
    { name: "results", type: "json" },
    { name: "simRuns", type: "number" },
    { name: "createdAt", type: "date" },
  ]);

  await ensureCollection(pb, "match_odds", [
    { name: "fixtureId", type: "text", required: true },
    { name: "matchId", type: "text" },
    { name: "oddsHome", type: "number" },
    { name: "oddsDraw", type: "number" },
    { name: "oddsAway", type: "number" },
    { name: "fetchedAt", type: "date" },
  ]);

  await ensureCollection(pb, "team_tournament_stats", [
    { name: "teamCode", type: "text", required: true },
    { name: "xgPerGame", type: "number" },
    { name: "gfPerGame", type: "number" },
    { name: "gaPerGame", type: "number" },
    { name: "gamesPlayed", type: "number" },
    { name: "lastUpdated", type: "date" },
  ]);

  await ensureCollection(pb, "h2h", [
    { name: "homeCode", type: "text", required: true },
    { name: "awayCode", type: "text", required: true },
    { name: "homeWins", type: "number" },
    { name: "draws", type: "number" },
    { name: "awayWins", type: "number" },
    { name: "total", type: "number" },
    { name: "fetchedAt", type: "date" },
  ]);

  await ensureCollection(pb, "team_squads", [
    { name: "teamCode", type: "text", required: true },
    { name: "squadSize", type: "number" },
    { name: "outfieldPlayers", type: "number" },
    { name: "depthScore", type: "number" },
    { name: "fetchedAt", type: "date" },
  ]);

}
