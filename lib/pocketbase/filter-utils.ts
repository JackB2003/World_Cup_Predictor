const MATCH_ID_RE = /^(m\d+|af-\d+)$/;

export function isValidMatchId(id: string): boolean {
  return MATCH_ID_RE.test(id);
}

export function assertValidMatchId(id: string): void {
  if (!isValidMatchId(id)) {
    throw new Error(`Invalid matchId: ${id}`);
  }
}

export function escapePbFilterString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function pbFieldEquals(field: string, value: string): string {
  return `${field} = "${escapePbFilterString(value)}"`;
}

export function validateTeamNames(teamNames: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [code, name] of Object.entries(teamNames)) {
    if (code.length > 8 || name.length > 80) continue;
    out[code] = name;
  }
  return out;
}
