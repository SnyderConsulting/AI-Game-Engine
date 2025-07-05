import test from "node:test";
import assert from "node:assert/strict";
import {
  moveTowards,
  isColliding,
  generateWalls,
  circleRectColliding,
  SEGMENT_SIZE,
} from "../src/game_logic.js";

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

test("generateWalls creates segments within bounds", () => {
  const walls = generateWalls(100, 100, 1);
  assert(walls.length >= 3 && walls.length <= 5);
  walls.forEach((w) => {
    assert(w.x >= 0 && w.x + w.size <= 100);
    assert(w.y >= 0 && w.y + w.size <= 100);
    assert.strictEqual(w.size, SEGMENT_SIZE);
  });
});

test("circleRectColliding detects intersection", () => {
  const rect = { x: 40, y: 40, size: SEGMENT_SIZE };
  const circle = { x: 50, y: 50 };
  assert.strictEqual(circleRectColliding(circle, rect, 10), true);
  const far = { x: 10, y: 10 };
  assert.strictEqual(circleRectColliding(far, rect, 10), false);
});
