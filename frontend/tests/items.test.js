import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer } from "../src/player.js";
import { PLAYER_MAX_HEALTH } from "../src/game_logic.js";
import { applyConsumableEffect } from "../src/items.js";

test("applyConsumableEffect heals with medkit", () => {
  const p = createPlayer(PLAYER_MAX_HEALTH);
  p.health = 5;
  const res = applyConsumableEffect(p, "medkit");
  assert.strictEqual(res, true);
  assert.strictEqual(p.health, 8);
});

test("applyConsumableEffect grants mutation point", () => {
  const p = createPlayer(PLAYER_MAX_HEALTH);
  const res = applyConsumableEffect(p, "mutation_serum_fire");
  assert.strictEqual(res, true);
  assert.strictEqual(p.fireMutationPoints, 1);
});

test("applyConsumableEffect returns false for unknown item", () => {
  const p = createPlayer(PLAYER_MAX_HEALTH);
  const res = applyConsumableEffect(p, "fire_core");
  assert.strictEqual(res, false);
});
