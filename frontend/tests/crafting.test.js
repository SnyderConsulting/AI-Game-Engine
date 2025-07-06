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
