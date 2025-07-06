import test from "node:test";
import assert from "node:assert/strict";
import { createInventory, addItem } from "../src/inventory.js";
import { RECIPES, craftRecipe } from "../src/crafting.js";

test("craftRecipe consumes ingredients and adds item", () => {
  const inv = createInventory();
  addItem(inv, "flesh", 1);
  addItem(inv, "teeth", 1);
  const recipe = RECIPES.find((r) => r.id === "zombie_essence");
  const success = craftRecipe(inv, recipe);
  assert.strictEqual(success, true);
  const inInv = inv.slots.some((s) => s.item === "zombie_essence");
  const inBar = inv.hotbar.some((s) => s.item === "zombie_essence");
  assert.strictEqual(inInv || inBar, true);
});

test("craft fire mutation serum", () => {
  const inv = createInventory();
  addItem(inv, "fire_core", 3);
  const recipe = RECIPES.find((r) => r.id === "mutation_serum_fire");
  const success = craftRecipe(inv, recipe);
  assert.strictEqual(success, true);
  const inInv = inv.slots.some((s) => s.item === "mutation_serum_fire");
  const inBar = inv.hotbar.some((s) => s.item === "mutation_serum_fire");
  assert.strictEqual(inInv || inBar, true);
  const coresLeft = inv.slots
    .concat(inv.hotbar)
    .some((s) => s.item === "fire_core");
  assert.strictEqual(coresLeft, false);
});
