import { test } from "node:test";
import assert from "node:assert/strict";
import { gradePick, isPickLocked, resolvePick } from "./daily-picks";

test("resolvePick labels home, away, and draw", () => {
  const names = { ARG: "Argentina", FRA: "France" };
  assert.equal(resolvePick("home", "ARG", "FRA", names).pickLabel, "Argentina Win");
  assert.equal(resolvePick("away", "ARG", "FRA", names).pickLabel, "France Win");
  assert.equal(resolvePick("draw", "ARG", "FRA", names).pickLabel, "Draw");
});

test("gradePick checks winner and draw", () => {
  assert.equal(gradePick("ARG", "ARG", "FRA", 2, 1), true);
  assert.equal(gradePick("FRA", "ARG", "FRA", 2, 1), false);
  assert.equal(gradePick("DRAW", "ARG", "FRA", 1, 1), true);
  assert.equal(gradePick("ARG", "ARG", "FRA", 1, 1), false);
});

test("isPickLocked respects kickoff time", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  assert.equal(isPickLocked(past), true);
  assert.equal(isPickLocked(future), false);
  assert.equal(isPickLocked(undefined), false);
});
