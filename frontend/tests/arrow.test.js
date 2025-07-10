import test from "node:test";
import assert from "node:assert/strict";
import {
  createArrow,
  updateArrows,
  predictArrowEndpoint,
} from "../src/entities/arrow.js";

// helper stubs
import { circleRectColliding } from "../src/systems/collision-system.js";
import { isColliding } from "../src/utils/geometry.js";

test("createArrow normalizes direction", () => {
  const a = createArrow(0, 0, { x: 3, y: 4 });
  assert(Math.abs(a.vx - 1.8) < 1e-6);
  assert(Math.abs(a.vy - 2.4) < 1e-6);
  assert.strictEqual(a.damage, 2);
});

test("updateArrows hits zombie and removes", () => {
  const arrows = [createArrow(0, 0, { x: 1, y: 0 }, 1.5)];
  assert.strictEqual(arrows[0].damage, 3);
  const zombies = [{ x: 5, y: 0, health: 2 }];
  for (let i = 0; i < 10 && arrows.length > 0; i++) {
    updateArrows(arrows, zombies, []);
  }
  assert.strictEqual(arrows.length, 0);
  assert(zombies.length === 0 || zombies[0].health < 2);
});

test("predictArrowEndpoint stops at obstacles", () => {
  const wall = { x: 10, y: -5, size: 10 };
  const end1 = predictArrowEndpoint(0, 0, { x: 1, y: 0 }, [wall], []);
  assert(end1.x <= 10);
  const end2 = predictArrowEndpoint(0, 0, { x: 1, y: 0 }, [], [{ x: 5, y: 0 }]);
  assert(end2.x <= 5);
});
