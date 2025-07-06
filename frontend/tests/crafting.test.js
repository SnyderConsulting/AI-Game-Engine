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
  assert.strictEqual(
    inv.slots.some((s) => s.item === "zombie_essence"),
    true,
  );
});

test("craft fire mutation serum", () => {
  const inv = createInventory();
  addItem(inv, "fire_core", 3);
  const recipe = RECIPES.find((r) => r.id === "mutation_serum_fire");
  const success = craftRecipe(inv, recipe);
  assert.strictEqual(success, true);
  assert.strictEqual(inv.slots.some((s) => s.item === "mutation_serum_fire"), true);
  assert.strictEqual(inv.slots.some((s) => s.item === "fire_core"), false);
});
