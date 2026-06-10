/**
 * Resolves API-Football team references to FIFA 3-letter codes used in PocketBase.
 */

import {
  API_CODE_ALIASES,
  NAME_ALIASES,
  TEAM_ID_TO_CODE,
  WC2026_CODES,
} from "@/lib/api-football/wc2026-teams";

export { NAME_ALIASES, TEAM_ID_TO_CODE } from "@/lib/api-football/wc2026-teams";

export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type PbTeamRef = { code: string; name: string; apiTeamId?: number };

function codeFromApiField(apiCode: string | null | undefined): string | null {
  if (!apiCode || apiCode.length !== 3) return null;
  const upper = apiCode.toUpperCase();
  if (API_CODE_ALIASES[upper]) return API_CODE_ALIASES[upper];
  if (WC2026_CODES.has(upper)) return upper;
  return null;
}

export function resolveTeamCode(
  apiTeam: { id: number; name: string; code?: string | null },
  pbTeams: PbTeamRef[] = [],
): string | null {
  const byApiId = pbTeams.find((t) => t.apiTeamId === apiTeam.id);
  if (byApiId) return byApiId.code;

  const mapped = TEAM_ID_TO_CODE[apiTeam.id];
  if (mapped) return mapped;

  const fromApiCode = codeFromApiField(apiTeam.code);
  if (fromApiCode) return fromApiCode;

  const normalized = normalizeTeamName(apiTeam.name);
  const fromAlias = NAME_ALIASES[normalized];
  if (fromAlias) return fromAlias;

  const byName = pbTeams.find((t) => normalizeTeamName(t.name) === normalized);
  if (byName) return byName.code;

  return null;
}
