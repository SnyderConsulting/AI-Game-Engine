import test from "node:test";
import assert from "node:assert/strict";
import {
  createWall,
  generateStoreWalls,
  WALL_MATERIALS,
  damageWall,
  updateWalls,
  wallSwingHit,
} from "../src/entities/walls.js";
import { SEGMENT_SIZE } from "../src/game_logic.js";

test("createWall sets hp based on material", () => {
  const w = createWall(0, 0, "steel");
  assert.strictEqual(w.hp, WALL_MATERIALS.steel.hp);
  assert.strictEqual(w.size, SEGMENT_SIZE);
});

test("generateStoreWalls returns walls with materials", () => {
  const walls = generateStoreWalls(200, 200);
  assert(walls.length > 0);
  walls.forEach((w) => {
    assert.ok(WALL_MATERIALS[w.material]);
  });
});

test("damageWall returns true when a wall breaks", () => {
  const w = createWall(0, 0, "plastic");
  const destroyed = damageWall(w, WALL_MATERIALS.plastic.hp);
  assert.strictEqual(destroyed, true);
  const arr = [w];
  updateWalls(arr);
  assert.strictEqual(arr.length, 0);
});

test("damageWall returns false when a wall survives", () => {
  const w = createWall(0, 0, "wood");
  const destroyed = damageWall(w, 1);
  assert.strictEqual(destroyed, false);
  const arr = [w];
  updateWalls(arr);
  assert.strictEqual(arr.length, 1);
});

test("axe breaks wood wall in a few swings", () => {
  const w = createWall(0, 0, "wood");
  const dmg = 4; // axe damage defined in main.js
  let destroyed = false;
  for (let i = 0; i < 5 && !destroyed; i++) {
    destroyed = damageWall(w, dmg);
  }
  assert.strictEqual(destroyed, true);
  const arr = [w];
  updateWalls(arr);
  assert.strictEqual(arr.length, 0);
});

test("wallSwingHit detects melee contact at wall edge", () => {
  const wall = createWall(0, 0, "wood");
  const player = { x: SEGMENT_SIZE + 10, y: SEGMENT_SIZE / 2 };
  const dir = { x: -1, y: 0 };
  assert.strictEqual(wallSwingHit(player, wall, 30, dir, Math.PI / 2), true);
});
