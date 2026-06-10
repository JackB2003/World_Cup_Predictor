import fs from "fs/promises";
import path from "path";
import { ELO_CODE_TO_TEAM } from "@/lib/elo-ratings/codes";

const ELO_RATINGS_TSV_URL = "https://www.eloratings.net/World.tsv";

/** Parsed ratings keyed by our FIFA team code (e.g. ARG → 2115). */
export type EloRatingsByTeam = Record<string, number>;

function parseWorldTsv(raw: string): EloRatingsByTeam {
  const out: EloRatingsByTeam = {};

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 4) continue;

    const eloCode = parts[2]?.trim();
    const eloRaw = parts[3]?.trim();
    if (!eloCode || !eloRaw) continue;

    const elo = Number.parseInt(eloRaw, 10);
    if (Number.isNaN(elo)) continue;

    const teamCode = ELO_CODE_TO_TEAM[eloCode];
    if (teamCode) out[teamCode] = elo;
  }

  return out;
}

async function readMockTsv(): Promise<string> {
  const file = path.join(process.cwd(), "fixtures", "elo-ratings", "World.tsv");
  return fs.readFile(file, "utf-8");
}

export async function fetchWorldEloRatings(): Promise<EloRatingsByTeam> {
  const useMock = process.env.ELO_RATINGS_MOCK === "true";

  const raw = useMock
    ? await readMockTsv()
    : await (async () => {
        const res = await fetch(ELO_RATINGS_TSV_URL, {
          headers: { Accept: "text/plain" },
          next: { revalidate: 0 },
        });
        if (!res.ok) {
          throw new Error(`eloratings.net returned ${res.status}`);
        }
        return res.text();
      })();

  return parseWorldTsv(raw);
}
