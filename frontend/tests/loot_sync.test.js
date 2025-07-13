import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { GameScene } from "../src/scenes/game-scene.js";
import { countItem } from "../src/systems/inventory-system.js";

function setupScene() {
  const dom = new JSDOM(`<!DOCTYPE html><canvas id="gameCanvas"></canvas>
  <div id="inventory"></div>
  <div id="inventoryGrid"></div>
  <div id="hotbar"></div>
  <div id="inventoryBar"></div>
  <button id="inventoryClose"></button>
  <div id="craftingMenu"></div>
  <div id="craftingList"></div>
  <div id="craftingBar"></div>
  <button id="craftingClose"></button>
  <div id="skillTree"></div>
  <div id="skillTreeBar"></div>
  <button id="skillTreeClose"></button>
  <div id="skillPoints"></div>
  <div id="skillGrid"></div>
  <div id="skillDetails"></div>
  <div id="skillName"></div>
  <div id="skillDesc"></div>
  <ul id="skillLevels"></ul>
  <div id="skillLevel"></div>
  <div id="skillCost"></div>
  <button id="skillUpgrade"></button>
  <div id="pickupMessage"></div>
  <div id="waveCounter"></div>
  <div id="gameOver"></div>
  <button id="newGameBtn"></button>
  <div id="lootProgress"></div>
  <div id="lootFill"></div>`);
  global.window = dom.window;
  global.document = dom.window.document;
  global.window.requestAnimationFrame = () => {};
  global.requestAnimationFrame = () => {};
  return new GameScene();
}

test("handleServerMessage syncs inventory and shows loot message", () => {
  const scene = setupScene();
  scene.playerId = "p1";
  scene.state = {
    players: { p1: { inventory: {} } },
    containers: [{ id: "c1", x: 0, y: 0, opened: false, item: null }],
    walls: [],
    zombies: [],
    width: 100,
    height: 100,
  };
  let message = null;
  scene.hud.showPickupMessage = (txt) => {
    message = txt;
  };
  const newState = {
    players: { p1: { inventory: { wood: 1 } } },
    containers: [{ id: "c1", x: 0, y: 0, opened: true, item: "wood" }],
    walls: [],
    zombies: [],
    width: 100,
    height: 100,
  };
  scene.handleServerMessage(JSON.stringify(newState));
  assert.strictEqual(countItem(scene.inventory, "wood"), 1);
  assert.strictEqual(message, "You found wood");
});
