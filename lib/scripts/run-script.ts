export function runScript(main: () => Promise<void>): void {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export function leagueSeasonFromEnv(): { leagueId: string; season: string } {
  return {
    leagueId: process.env.WORLD_CUP_LEAGUE_ID ?? "1",
    season: process.env.WORLD_CUP_SEASON ?? "2026",
  };
}
