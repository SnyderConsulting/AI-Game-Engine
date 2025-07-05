import test from "node:test";
import assert from "node:assert/strict";
import { moveTowards, isColliding } from "../src/game_logic.js";

test("moveTowards moves entity toward target", () => {
  const zombie = { x: 0, y: 0 };
  const player = { x: 3, y: 4 }; // distance 5
  moveTowards(zombie, player, 1);
  assert(Math.abs(zombie.x - 0.6) < 1e-6);
  assert(Math.abs(zombie.y - 0.8) < 1e-6);
});

test("isColliding detects overlap", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 5, y: 0 };
  assert.strictEqual(isColliding(a, b, 3), true);
  const c = { x: 7, y: 0 };
  assert.strictEqual(isColliding(a, c, 3), false);
});
