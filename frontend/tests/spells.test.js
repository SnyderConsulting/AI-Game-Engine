import test from "node:test";
import assert from "node:assert/strict";
import {
  createFireball,
  updateFireballs,
  updateExplosions,
  fireballStats,
  predictFireballEndpoint,
} from "../src/entities/spells.js";

// mocks for game_logic helpers
import { circleRectColliding } from "../src/systems/collision-system.js";
import { isColliding } from "../src/utils/geometry.js";

test("createFireball normalizes direction", () => {
  const fb = createFireball(0, 0, { x: 3, y: 4 }, 1);
  assert(Math.abs(fb.vx - 1.8) < 1e-6);
  assert(Math.abs(fb.vy - 2.4) < 1e-6);
});

test("updateFireballs moves and hits zombie", () => {
  const fireballs = [createFireball(0, 0, { x: 1, y: 0 }, 1)];
  const zombies = [{ x: 5, y: 0, health: 3 }];
  const explosions = [];
  for (let i = 0; i < 10 && fireballs.length > 0; i++) {
    updateFireballs(fireballs, zombies, [], explosions);
    updateExplosions(explosions);
  }
  assert.strictEqual(fireballs.length, 0);
  assert.strictEqual(zombies.length === 0 || zombies[0].health < 3, true);
  assert(explosions.length > 0);
});

test("fireballStats scales with level", () => {
  const l1 = fireballStats(1);
  const l2 = fireballStats(2);
  const l3 = fireballStats(3);
  assert.strictEqual(l1.damage, 1);
  assert.strictEqual(l1.radius, 40);
  assert.strictEqual(l2.damage, 2);
  assert.strictEqual(l2.radius, 60);
  assert.strictEqual(l3.damage, 3);
  assert.strictEqual(l3.radius, 80);
  assert.strictEqual(l3.pierce, 1);
});

test("predictFireballEndpoint stops at zombie", () => {
  const end = predictFireballEndpoint(
    0,
    0,
    { x: 1, y: 0 },
    [],
    [{ x: 5, y: 0 }],
  );
  assert(end.x <= 5);
});
