import test from "node:test";
import assert from "node:assert/strict";
import {
  createContainer,
  openContainer,
  CONTAINER_LOOT,
} from "../src/game_logic.js";

// helper to stub Math.random
function withRandom(value, fn) {
  const orig = Math.random;
  Math.random = () => value;
  try {
    fn();
  } finally {
    Math.random = orig;
  }
}

test("openContainer sets opened and returns loot", () => {
  const c = createContainer(0, 0);
  withRandom(0, () => {
    const item = openContainer(c);
    assert.strictEqual(c.opened, true);
    assert.strictEqual(c.item, item);
    assert.strictEqual(CONTAINER_LOOT.includes(item), true);
  });
});
