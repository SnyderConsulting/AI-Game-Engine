import test from "node:test";
import assert from "node:assert/strict";
import {
  createWall,
  generateStoreWalls,
  WALL_MATERIALS,
} from "../src/walls.js";
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
