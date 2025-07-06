import test from "node:test";
import assert from "node:assert/strict";
import {
  createInventory,
  addItem,
  consumeHotbarItem,
  moveToHotbar,
} from "../src/inventory.js";

test("addItem stacks and fills slots", () => {
  const inv = createInventory(1, 2);
  assert.strictEqual(addItem(inv, "core", 5), true);
  assert.strictEqual(inv.slots[0].count, 5);
  assert.strictEqual(addItem(inv, "core", 6), true);
  assert.strictEqual(inv.slots[0].count, 10);
  assert.strictEqual(inv.slots[1].count, 1);
});

test("consumeHotbarItem reduces count", () => {
  const inv = createInventory();
  addItem(inv, "flesh", 1);
  moveToHotbar(inv, 0, 0);
  const item = consumeHotbarItem(inv, 0);
  assert.strictEqual(item, "flesh");
  assert.strictEqual(inv.hotbar[0].item, null);
});
