/**
 * All 48 FIFA World Cup 2026 participants — FIFA codes, API-Football IDs, and name aliases.
 * API IDs are stable across seasons (see api-football.com documentation).
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
  { code: "CZE", name: "Czechia", apiTeamId: 770, aliases: ["czechia", "czech republic"] },
  { code: "RSA", name: "South Africa", apiTeamId: 1530, aliases: ["south africa"] },
  { code: "KOR", name: "Korea Republic", apiTeamId: 17, aliases: ["korea republic", "south korea"] },
  { code: "CAN", name: "Canada", apiTeamId: 5529, aliases: ["canada"], host: true },
  { code: "BIH", name: "Bosnia and Herzegovina", apiTeamId: 1113, aliases: ["bosnia and herzegovina", "bosnia"] },
  { code: "QAT", name: "Qatar", apiTeamId: 34, aliases: ["qatar"] },
  { code: "SUI", name: "Switzerland", apiTeamId: 20, aliases: ["switzerland"] },
  { code: "BRA", name: "Brazil", apiTeamId: 6, aliases: ["brazil"] },
  { code: "HAI", name: "Haiti", apiTeamId: 23876, aliases: ["haiti"] },
  { code: "MAR", name: "Morocco", apiTeamId: 31, aliases: ["morocco"] },
  { code: "SCO", name: "Scotland", apiTeamId: 38, aliases: ["scotland"] },
  { code: "USA", name: "USA", apiTeamId: 2384, aliases: ["usa", "united states"] },
  { code: "AUS", name: "Australia", apiTeamId: 30, aliases: ["australia"] },
  { code: "PAR", name: "Paraguay", apiTeamId: 15, aliases: ["paraguay"] },
  { code: "TUR", name: "Türkiye", apiTeamId: 7789, aliases: ["turkiye", "turkey"] },
  { code: "CUW", name: "Curaçao", apiTeamId: 16163, aliases: ["curacao", "curaçao"] },
  { code: "ECU", name: "Ecuador", apiTeamId: 29, aliases: ["ecuador"] },
  { code: "GER", name: "Germany", apiTeamId: 25, aliases: ["germany"] },
  { code: "CIV", name: "Côte d'Ivoire", apiTeamId: 1507, aliases: ["cote d'ivoire", "ivory coast", "côte d'ivoire"] },
  { code: "NED", name: "Netherlands", apiTeamId: 11, aliases: ["netherlands"] },
  { code: "JPN", name: "Japan", apiTeamId: 12, aliases: ["japan"] },
  { code: "SWE", name: "Sweden", apiTeamId: 47, aliases: ["sweden"] },
  { code: "TUN", name: "Tunisia", apiTeamId: 1532, aliases: ["tunisia"] },
  { code: "BEL", name: "Belgium", apiTeamId: 1, aliases: ["belgium"] },
  { code: "EGY", name: "Egypt", apiTeamId: 24, aliases: ["egypt"] },
  { code: "IRN", name: "IR Iran", apiTeamId: 32, aliases: ["ir iran", "iran"] },
  { code: "NZL", name: "New Zealand", apiTeamId: 4673, aliases: ["new zealand"] },
  { code: "CPV", name: "Cabo Verde", apiTeamId: 1524, aliases: ["cabo verde", "cape verde", "cape verde islands"] },
  { code: "KSA", name: "Saudi Arabia", apiTeamId: 33, aliases: ["saudi arabia"] },
  { code: "ESP", name: "Spain", apiTeamId: 9, aliases: ["spain"] },
  { code: "URU", name: "Uruguay", apiTeamId: 7, aliases: ["uruguay"] },
  { code: "FRA", name: "France", apiTeamId: 2, aliases: ["france"] },
  { code: "NOR", name: "Norway", apiTeamId: 1090, aliases: ["norway"] },
  { code: "SEN", name: "Senegal", apiTeamId: 22, aliases: ["senegal"] },
  { code: "IRQ", name: "Iraq", apiTeamId: 1628, aliases: ["iraq"] },
  { code: "ALG", name: "Algeria", apiTeamId: 28, aliases: ["algeria"] },
  { code: "ARG", name: "Argentina", apiTeamId: 26, aliases: ["argentina"] },
  { code: "AUT", name: "Austria", apiTeamId: 1108, aliases: ["austria"] },
  { code: "JOR", name: "Jordan", apiTeamId: 1534, aliases: ["jordan"] },
  { code: "COL", name: "Colombia", apiTeamId: 8, aliases: ["colombia"] },
  { code: "POR", name: "Portugal", apiTeamId: 27, aliases: ["portugal"] },
  { code: "UZB", name: "Uzbekistan", apiTeamId: 1098, aliases: ["uzbekistan"] },
  { code: "CRO", name: "Croatia", apiTeamId: 3, aliases: ["croatia"] },
  { code: "ENG", name: "England", apiTeamId: 10, aliases: ["england"] },
  { code: "GHA", name: "Ghana", apiTeamId: 1504, aliases: ["ghana"] },
  { code: "PAN", name: "Panama", apiTeamId: 19, aliases: ["panama"] },
  { code: "COD", name: "Congo DR", apiTeamId: 1508, aliases: ["congo dr", "dr congo", "congo"] },
];

export const WC2026_CODES = new Set(WC2026_TEAMS.map((t) => t.code));

export const TEAM_ID_TO_CODE: Record<number, string> = {
  ...Object.fromEntries(WC2026_TEAMS.map((t) => [t.apiTeamId, t.code])),
  // API-Football World Cup fixtures list this team as "Cape Verde Islands" (id 2597).
  2597: "CPV",
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
  CUW: "CUW",
  CIV: "CIV",
  CPV: "CPV",
  RSA: "RSA",
  KOR: "KOR",
  IRN: "IRN",
  BIH: "BIH",
  COD: "COD",
};
