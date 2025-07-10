import test from "node:test";
import assert from "node:assert/strict";
import {
  createInventory,
  addItem,
  consumeHotbarItem,
  swapHotbar,
  swapInventoryHotbar,
  moveFromHotbar,
  moveToHotbar,
  countItem,
  removeItem,
  setActiveHotbar,
  getActiveHotbarItem,
} from "../src/systems/inventory-system.js";

test("addItem prioritizes hotbar then stacks", () => {
  const inv = createInventory(1, 2);
  assert.strictEqual(addItem(inv, "core", 5), true);
  assert.strictEqual(inv.hotbar[0].count, 5);
  assert.strictEqual(addItem(inv, "core", 6), true);
  assert.strictEqual(inv.hotbar[0].count, 10);
  assert.strictEqual(inv.hotbar[1].count, 1);
});

test("wood stacks up to 20", () => {
  const inv = createInventory();
  addItem(inv, "wood", 20);
  assert.strictEqual(inv.hotbar[0].count, 20);
  addItem(inv, "wood", 5);
  assert.strictEqual(countItem(inv, "wood"), 25);
});

test("consumeHotbarItem reduces count", () => {
  const inv = createInventory();
  addItem(inv, "flesh", 1);
  const item = consumeHotbarItem(inv, 0);
  assert.strictEqual(item, "flesh");
  assert.strictEqual(inv.hotbar[0].item, null);
});

test("countItem totals across slots and hotbar", () => {
  const inv = createInventory();
  addItem(inv, "core", 3);
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
  swapHotbar(inv, 0, 1);
  assert.strictEqual(inv.hotbar[0].item, "flesh");
  assert.strictEqual(inv.hotbar[1].item, "core");
});

test("moveFromHotbar moves item back to inventory", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  moveFromHotbar(inv, 0, 1);
  assert.strictEqual(inv.hotbar[0].item, null);
  assert.strictEqual(inv.slots[1].item, "core");
});

test("setActiveHotbar updates active slot", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  swapHotbar(inv, 0, 2);
  setActiveHotbar(inv, 2);
  const slot = getActiveHotbarItem(inv);
  assert.strictEqual(inv.active, 2);
  assert.strictEqual(slot.item, "core");
});

test("swapInventoryHotbar exchanges inventory and hotbar", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  addItem(inv, "flesh", 1);
  // move core to inventory slot 1, flesh remains in hotbar 1
  moveFromHotbar(inv, 0, 1);
  swapInventoryHotbar(inv, 1, 1);
  assert.strictEqual(inv.slots[1].item, "flesh");
  assert.strictEqual(inv.hotbar[1].item, "core");
});

test("moveToHotbar requires source item and free slot", () => {
  const inv = createInventory();
  addItem(inv, "core", 1);
  moveFromHotbar(inv, 0, 0); // place core in inventory slot 0
  addItem(inv, "flesh", 1); // fills hotbar[0]
  assert.strictEqual(moveToHotbar(inv, 0, 0), false); // dest occupied
  assert.strictEqual(inv.slots[0].item, "core");
  assert.strictEqual(moveToHotbar(inv, 2, 1), false); // source empty
});
