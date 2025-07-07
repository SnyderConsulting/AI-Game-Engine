import test from "node:test";
import assert from "node:assert/strict";
import { createArrow, updateArrows } from "../src/arrow.js";

// helper stubs
import { circleRectColliding, isColliding } from "../src/game_logic.js";

test("createArrow normalizes direction", () => {
  const a = createArrow(0, 0, { x: 3, y: 4 });
  assert(Math.abs(a.vx - 1.8) < 1e-6);
  assert(Math.abs(a.vy - 2.4) < 1e-6);
});

test("updateArrows hits zombie and removes", () => {
  const arrows = [createArrow(0, 0, { x: 1, y: 0 })];
  const zombies = [{ x: 5, y: 0, health: 2 }];
  for (let i = 0; i < 10 && arrows.length > 0; i++) {
    updateArrows(arrows, zombies, []);
  }
  assert.strictEqual(arrows.length, 0);
  assert(zombies.length === 0 || zombies[0].health < 2);
});
