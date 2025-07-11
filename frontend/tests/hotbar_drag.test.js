import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createInventory, addItem } from "../src/systems/inventory-system.js";
import { createInventoryUI } from "../src/components/inventory-ui.js";

test("hotbar icons are not draggable", () => {
  const dom = new JSDOM(
    `<!DOCTYPE html><div id="grid"></div><div id="hot"></div>`,
  );
  global.document = dom.window.document;
  global.window = dom.window;

  const inv = createInventory();
  addItem(inv, "core", 1);
  const { renderInventory, renderHotbar } = createInventoryUI({
    inventoryDiv: document.createElement("div"),
    inventoryGrid: document.getElementById("grid"),
    hotbarDiv: document.getElementById("hot"),
    inventoryBar: document.createElement("div"),
    inventoryClose: document.createElement("button"),
    inventoryPos: { left: null, top: null },
  });
  renderInventory(inv, {}, {}, { core: "core.png" }, () => ({
    remaining: 0,
    max: 0,
  }));
  renderHotbar(inv, {}, {}, { core: "core.png" }, () => ({
    remaining: 0,
    max: 0,
  }));

  const img = dom.window.document.querySelector("#hot img");
  assert.strictEqual(img.draggable, false);
});
