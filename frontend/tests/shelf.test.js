import test from "node:test";
import assert from "node:assert/strict";
import { createWall, openShelf } from "../src/walls.js";

function withRandomValues(values, fn) {
  const orig = Math.random;
  let i = 0;
  Math.random = () => values[i++] ?? 1;
  try {
    fn();
  } finally {
    Math.random = orig;
  }
}

test("openShelf returns item when chance succeeds", () => {
  const w = createWall(0, 0, "wood");
  withRandomValues([0, 0], () => {
    const item = openShelf(w, ["a", "b"]);
    assert.strictEqual(w.opened, true);
    assert.strictEqual(item, "a");
    assert.strictEqual(w.item, "a");
  });
});

test("openShelf may give no item", () => {
  const w = createWall(0, 0, "wood");
  withRandomValues([0.99], () => {
    const item = openShelf(w, ["a"]);
    assert.strictEqual(w.opened, true);
    assert.strictEqual(item, null);
    assert.strictEqual(w.item, null);
  });
});
