import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { GameScene } from "../src/scenes/game-scene.js";

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
  global.WebSocket = { OPEN: 1 };
  return new GameScene();
}

test("arrow keys map to movement", () => {
  const scene = setupScene();
  scene.playerId = "p";
  scene.state.players = { p: { x: 0, y: 0 } };
  let sent = null;
  scene.ws = { readyState: 1, send: (msg) => (sent = JSON.parse(msg)) };
  scene.handleKeyDown({ key: "ArrowRight" });
  scene.update();
  assert.strictEqual(sent.moveX, 1);
  scene.handleKeyUp({ key: "ArrowRight" });
  scene.handleKeyDown({ key: "ArrowUp" });
  scene.update();
  assert.strictEqual(sent.moveY, -1);
});

test("page down starts and stops looting", () => {
  const scene = setupScene();
  scene.playerId = "p";
  scene.state.players = { p: { x: 0, y: 0 } };
  scene.state.containers = [{ id: "c1", x: 0, y: 0, opened: false }];
  let sent = null;
  scene.ws = { readyState: 1, send: (msg) => (sent = JSON.parse(msg)) };
  scene.handleKeyDown({ key: "PageDown" });
  assert.strictEqual(sent.action, "start_looting");
  scene.handleKeyUp({ key: "PageDown" });
  assert.strictEqual(sent.action, "cancel_looting");
});

test("tab sends attack action", () => {
  const scene = setupScene();
  scene.playerId = "p";
  scene.state.players = { p: { x: 0, y: 0 } };
  let sent = null;
  scene.ws = { readyState: 1, send: (msg) => (sent = JSON.parse(msg)) };
  scene.handleKeyDown({ key: "Tab" });
  assert.strictEqual(sent.action, "attack");
});
