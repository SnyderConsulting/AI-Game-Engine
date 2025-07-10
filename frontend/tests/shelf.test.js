import test from "node:test";
import assert from "node:assert/strict";
import { createWall, openShelf } from "../src/entities/walls.js";
import { CRAFTING_MATERIALS } from "../src/items.js";

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

test("CRAFTING_MATERIALS excludes spells", () => {
  const hasSpell = CRAFTING_MATERIALS.some(
    (id) => id.includes("spell") || id.includes("skill"),
  );
  assert.strictEqual(hasSpell, false);
});

test("openShelf returns crafting material from pool", () => {
  const w = createWall(0, 0, "wood");
  withRandomValues([0, 0], () => {
    const item = openShelf(w, CRAFTING_MATERIALS);
    assert.ok(CRAFTING_MATERIALS.includes(item));
  });
});
