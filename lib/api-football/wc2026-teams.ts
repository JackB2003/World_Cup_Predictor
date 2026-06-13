/**
 * All 48 FIFA World Cup 2026 participants — FIFA codes, API-Football IDs, and name aliases.
 *
 * IMPORTANT: apiTeamId and name are sourced directly from API-Football
 * (league=1, season=2026) and verified against its /teams and /standings
 * endpoints. A prior version of this file had shifted/incorrect IDs which
 * caused codes to bind to the wrong API teams during import (e.g. SUI bound to
 * Australia's id 20, AUT to Scotland's id 1108). Do not edit IDs without
 * re-verifying against the live API.
 */

export type Wc2026Team = {
  code: string;
  name: string;
  apiTeamId: number;
  aliases: string[];
  host?: boolean;
};

/** Canonical registry of World Cup 2026 teams. */
export const WC2026_TEAMS: Wc2026Team[] = [
  { code: "MEX", name: "Mexico", apiTeamId: 16, aliases: ["mexico"], host: true },
  { code: "KOR", name: "Korea Republic", apiTeamId: 17, aliases: ["korea republic", "south korea"] },
  { code: "CZE", name: "Czechia", apiTeamId: 770, aliases: ["czechia", "czech republic"] },
  { code: "RSA", name: "South Africa", apiTeamId: 1531, aliases: ["south africa"] },
  { code: "CAN", name: "Canada", apiTeamId: 5529, aliases: ["canada"], host: true },
  { code: "BIH", name: "Bosnia and Herzegovina", apiTeamId: 1113, aliases: ["bosnia and herzegovina", "bosnia & herzegovina", "bosnia"] },
  { code: "QAT", name: "Qatar", apiTeamId: 1569, aliases: ["qatar"] },
  { code: "SUI", name: "Switzerland", apiTeamId: 15, aliases: ["switzerland"] },
  { code: "BRA", name: "Brazil", apiTeamId: 6, aliases: ["brazil"] },
  { code: "MAR", name: "Morocco", apiTeamId: 31, aliases: ["morocco"] },
  { code: "HAI", name: "Haiti", apiTeamId: 2386, aliases: ["haiti"] },
  { code: "SCO", name: "Scotland", apiTeamId: 1108, aliases: ["scotland"] },
  { code: "USA", name: "USA", apiTeamId: 2384, aliases: ["usa", "united states"] },
  { code: "AUS", name: "Australia", apiTeamId: 20, aliases: ["australia"] },
  { code: "TUR", name: "Türkiye", apiTeamId: 777, aliases: ["turkiye", "turkey", "türkiye"] },
  { code: "PAR", name: "Paraguay", apiTeamId: 2380, aliases: ["paraguay"] },
  { code: "GER", name: "Germany", apiTeamId: 25, aliases: ["germany"] },
  { code: "CUW", name: "Curaçao", apiTeamId: 5530, aliases: ["curacao", "curaçao"] },
  { code: "CIV", name: "Côte d'Ivoire", apiTeamId: 1501, aliases: ["cote d'ivoire", "ivory coast", "côte d'ivoire"] },
  { code: "ECU", name: "Ecuador", apiTeamId: 2382, aliases: ["ecuador"] },
  { code: "NED", name: "Netherlands", apiTeamId: 1118, aliases: ["netherlands"] },
  { code: "JPN", name: "Japan", apiTeamId: 12, aliases: ["japan"] },
  { code: "SWE", name: "Sweden", apiTeamId: 5, aliases: ["sweden"] },
  { code: "TUN", name: "Tunisia", apiTeamId: 28, aliases: ["tunisia"] },
  { code: "BEL", name: "Belgium", apiTeamId: 1, aliases: ["belgium"] },
  { code: "EGY", name: "Egypt", apiTeamId: 32, aliases: ["egypt"] },
  { code: "IRN", name: "IR Iran", apiTeamId: 22, aliases: ["ir iran", "iran"] },
  { code: "NZL", name: "New Zealand", apiTeamId: 4673, aliases: ["new zealand"] },
  { code: "ESP", name: "Spain", apiTeamId: 9, aliases: ["spain"] },
  { code: "CPV", name: "Cabo Verde", apiTeamId: 1533, aliases: ["cabo verde", "cape verde", "cape verde islands"] },
  { code: "KSA", name: "Saudi Arabia", apiTeamId: 23, aliases: ["saudi arabia"] },
  { code: "URU", name: "Uruguay", apiTeamId: 7, aliases: ["uruguay"] },
  { code: "FRA", name: "France", apiTeamId: 2, aliases: ["france"] },
  { code: "SEN", name: "Senegal", apiTeamId: 13, aliases: ["senegal"] },
  { code: "IRQ", name: "Iraq", apiTeamId: 1567, aliases: ["iraq"] },
  { code: "NOR", name: "Norway", apiTeamId: 1090, aliases: ["norway"] },
  { code: "ARG", name: "Argentina", apiTeamId: 26, aliases: ["argentina"] },
  { code: "ALG", name: "Algeria", apiTeamId: 1532, aliases: ["algeria"] },
  { code: "AUT", name: "Austria", apiTeamId: 775, aliases: ["austria"] },
  { code: "JOR", name: "Jordan", apiTeamId: 1548, aliases: ["jordan"] },
  { code: "POR", name: "Portugal", apiTeamId: 27, aliases: ["portugal"] },
  { code: "COD", name: "Congo DR", apiTeamId: 1508, aliases: ["congo dr", "dr congo", "congo"] },
  { code: "UZB", name: "Uzbekistan", apiTeamId: 1568, aliases: ["uzbekistan"] },
  { code: "COL", name: "Colombia", apiTeamId: 8, aliases: ["colombia"] },
  { code: "ENG", name: "England", apiTeamId: 10, aliases: ["england"] },
  { code: "CRO", name: "Croatia", apiTeamId: 3, aliases: ["croatia"] },
  { code: "GHA", name: "Ghana", apiTeamId: 1504, aliases: ["ghana"] },
  { code: "PAN", name: "Panama", apiTeamId: 11, aliases: ["panama"] },
];

export const WC2026_CODES = new Set(WC2026_TEAMS.map((t) => t.code));

export const TEAM_ID_TO_CODE: Record<number, string> = {
  ...Object.fromEntries(WC2026_TEAMS.map((t) => [t.apiTeamId, t.code])),
};

export const NAME_ALIASES: Record<string, string> = Object.fromEntries(
  WC2026_TEAMS.flatMap((t) => [
    [t.name.toLowerCase(), t.code],
    ...t.aliases.map((a) => [a, t.code]),
  ]),
);

/** API-Football `team.code` values that differ from our FIFA codes. */
export const API_CODE_ALIASES: Record<string, string> = {
  CZE: "CZE",
  CIV: "CIV",
  CPV: "CPV",
  RSA: "RSA",
  KOR: "KOR",
  IRN: "IRN",
  BIH: "BIH",
  // API-Football uses CGO for Congo DR and CUR for Curaçao; we use FIFA codes.
  CGO: "COD",
  CUR: "CUW",
};
