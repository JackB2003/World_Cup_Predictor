import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_DATA } from "@/lib/data/seed";
import { predictMatch } from "@/features/predictions/match-engine";
import type { Team } from "@/types/world-cup";

function team(code: string): Team {
  const t = SEED_DATA.teams.find((x) => x.code === code);
  if (!t) throw new Error(`missing seed team ${code}`);
  return t;
}

function scoreKey(pred: ReturnType<typeof predictMatch>): string {
  return `${pred.score[0]}-${pred.score[1]}`;
}

describe("predictMatch", () => {
  it("produces varied scorelines across seed matchups (not all 3-2)", () => {
    const matchups: [string, string][] = [
      ["FRA", "CRO"],
      ["USA", "GER"],
      ["ENG", "MAR"],
      ["CAN", "NED"],
      ["MEX", "URU"],
      ["ARG", "CAN"],
      ["ESP", "ITA"],
      ["BRA", "JPN"],
      ["POR", "COL"],
      ["BEL", "NED"],
    ];

    const scores = new Set(matchups.map(([h, a]) => scoreKey(predictMatch(team(h), team(a)))));
    assert.ok(scores.size >= 4, `expected diverse scores, got: ${[...scores].join(", ")}`);
    assert.ok(!matchups.every(([h, a]) => scoreKey(predictMatch(team(h), team(a))) === "3-2"));
  });

  it("keeps predicted score consistent with the pick", () => {
    const cases: [string, string][] = [
      ["FRA", "CRO"],
      ["USA", "GER"],
      ["CAN", "NED"],
      ["MEX", "URU"],
    ];

    for (const [homeCode, awayCode] of cases) {
      const home = team(homeCode);
      const away = team(awayCode);
      const pred = predictMatch(home, away);
      const [h, a] = pred.score;

      if (pred.pickKind === "draw") {
        assert.equal(h, a, `draw pick should have equal score for ${homeCode} vs ${awayCode}`);
      } else if (pred.pick === homeCode) {
        assert.ok(h > a, `home win pick should have h>a for ${homeCode} vs ${awayCode}: ${h}-${a}`);
      } else {
        assert.ok(a > h, `away win pick should have a>h for ${homeCode} vs ${awayCode}: ${h}-${a}`);
      }
    }
  });

  it("win/draw/away probabilities sum to 100", () => {
    const pred = predictMatch(team("FRA"), team("CRO"));
    assert.equal(pred.winH + pred.draw + pred.winA, 100);
  });

  it("confidence matches the probability of the picked outcome", () => {
    const pred = predictMatch(team("CAN"), team("NED"));
    if (pred.pickKind === "draw") assert.equal(pred.conf, pred.draw);
    else if (pred.pick === "CAN") assert.equal(pred.conf, pred.winH);
    else assert.equal(pred.conf, pred.winA);
  });
});
