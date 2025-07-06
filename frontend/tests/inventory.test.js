import test from "node:test";
import assert from "node:assert/strict";
import {
  createInventory,
  addItem,
  consumeHotbarItem,
  moveToHotbar,
  swapHotbar,
  moveFromHotbar,
  countItem,
  removeItem,
  setActiveHotbar,
  getActiveHotbarItem,
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

test("countItem totals across slots and hotbar", () => {
  const inv = createInventory();
  addItem(inv, "core", 3);
  moveToHotbar(inv, 0, 0);
  addItem(inv, "core", 2);
  assert.strictEqual(countItem(inv, "core"), 5);
});

test("removeItem deducts from inventory", () => {
  const inv = createInventory();
  addItem(inv, "teeth", 2);
  removeItem(inv, "teeth", 1);
  assert.strictEqual(countItem(inv, "teeth"), 1);
  removeItem(inv, "teeth", 1);
  assert.strictEqual(countItem(inv, "teeth"), 0);
});

test("swapHotbar exchanges slots", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  addItem(inv, "flesh", 1);
  moveToHotbar(inv, 0, 0);
  moveToHotbar(inv, 1, 1);
  swapHotbar(inv, 0, 1);
  assert.strictEqual(inv.hotbar[0].item, "flesh");
  assert.strictEqual(inv.hotbar[1].item, "core");
});

test("moveFromHotbar moves item back to inventory", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  moveToHotbar(inv, 0, 0);
  moveFromHotbar(inv, 0, 1);
  assert.strictEqual(inv.hotbar[0].item, null);
  assert.strictEqual(inv.slots[1].item, "core");
});

test("setActiveHotbar updates active slot", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  moveToHotbar(inv, 0, 2);
  setActiveHotbar(inv, 2);
  const slot = getActiveHotbarItem(inv);
  assert.strictEqual(inv.active, 2);
  assert.strictEqual(slot.item, "core");
});
