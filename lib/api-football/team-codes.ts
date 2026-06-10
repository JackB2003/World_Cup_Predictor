/**
 * Maps API-Football team IDs and names to FIFA 3-letter codes used in PocketBase.
 * IDs are stable in API-Football; names are normalized for alias lookup.
 */

export const TEAM_ID_TO_CODE: Record<number, string> = {
  26: "ARG",
  2: "FRA",
  9: "ESP",
  10: "ENG",
  6: "BRA",
  27: "POR",
  25: "GER",
  11: "NED",
  1: "BEL",
  3: "CRO",
  768: "ITA",
  7: "URU",
  2384: "USA",
  16: "MEX",
  31: "MAR",
  5529: "CAN",
  8: "COL",
  12: "JPN",
  17: "KOR",
  22: "SEN",
  23: "NGA",
  24: "EGY",
  28: "TUN",
  30: "AUS",
  32: "IRN",
  33: "KSA",
  34: "QAT",
  20: "SUI",
  21: "POL",
  29: "ECU",
  13: "PER",
  14: "CHI",
  15: "PAR",
  18: "CRC",
  19: "PAN",
  1100: "WAL",
  1530: "SCO",
  778: "UKR",
  5: "SRB",
  1108: "AUT",
  4: "DEN",
  7789: "TUR",
};

const NAME_ALIASES: Record<string, string> = {
  argentina: "ARG",
  france: "FRA",
  spain: "ESP",
  england: "ENG",
  brazil: "BRA",
  portugal: "POR",
  germany: "GER",
  netherlands: "NED",
  belgium: "BEL",
  croatia: "CRO",
  italy: "ITA",
  uruguay: "URU",
  usa: "USA",
  "united states": "USA",
  mexico: "MEX",
  morocco: "MAR",
  canada: "CAN",
  colombia: "COL",
  japan: "JPN",
  "korea republic": "KOR",
  "south korea": "KOR",
  senegal: "SEN",
  nigeria: "NGA",
  egypt: "EGY",
  tunisia: "TUN",
  australia: "AUS",
  iran: "IRN",
  "saudi arabia": "KSA",
  qatar: "QAT",
  switzerland: "SUI",
  poland: "POL",
  ecuador: "ECU",
  peru: "PER",
  chile: "CHI",
  paraguay: "PAR",
  "costa rica": "CRC",
  panama: "PAN",
  wales: "WAL",
  scotland: "SCO",
  ukraine: "UKR",
  serbia: "SRB",
  austria: "AUT",
  denmark: "DEN",
  turkey: "TUR",
};

export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type PbTeamRef = { code: string; name: string; apiTeamId?: number };

export function resolveTeamCode(
  apiTeam: { id: number; name: string },
  pbTeams: PbTeamRef[] = [],
): string | null {
  const byApiId = pbTeams.find((t) => t.apiTeamId === apiTeam.id);
  if (byApiId) return byApiId.code;

  const mapped = TEAM_ID_TO_CODE[apiTeam.id];
  if (mapped) return mapped;

  const normalized = normalizeTeamName(apiTeam.name);
  const fromAlias = NAME_ALIASES[normalized];
  if (fromAlias) return fromAlias;

  const byName = pbTeams.find((t) => normalizeTeamName(t.name) === normalized);
  if (byName) return byName.code;

  const byCode = pbTeams.find((t) => t.code === apiTeam.name.slice(0, 3).toUpperCase());
  if (byCode) return byCode.code;

  return null;
}
