import test from "node:test";
import assert from "node:assert/strict";
import { createFireball, updateFireballs } from "../src/spells.js";

// mocks for game_logic helpers
import { circleRectColliding, isColliding } from "../src/game_logic.js";

test("createFireball normalizes direction", () => {
  const fb = createFireball(0, 0, { x: 3, y: 4 }, 1);
  assert(Math.abs(fb.vx - 1.8) < 1e-6);
  assert(Math.abs(fb.vy - 2.4) < 1e-6);
});

test("updateFireballs moves and hits zombie", () => {
  const fireballs = [createFireball(0, 0, { x: 1, y: 0 }, 1)];
  const zombies = [{ x: 5, y: 0, health: 3 }];
  for (let i = 0; i < 10 && fireballs.length > 0; i++) {
    updateFireballs(fireballs, zombies, []);
  }
  assert.strictEqual(fireballs.length, 0);
  assert.strictEqual(zombies.length === 0 || zombies[0].health < 3, true);
});
