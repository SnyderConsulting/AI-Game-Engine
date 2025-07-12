import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { GameScene } from "../src/scenes/game-scene.js";

test("resizeCanvas scales by height and sets camera size", () => {
  const dom = new JSDOM(
    `<!DOCTYPE html><canvas id="gameCanvas"></canvas>
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
    <button id="newGameBtn"></button>`,
  );
  global.window = dom.window;
  global.document = dom.window.document;
  global.window.requestAnimationFrame = () => {};
  global.requestAnimationFrame = () => {};

  const scene = new GameScene();
  scene.state.width = 800;
  scene.state.height = 600;
  dom.window.innerWidth = 1200;
  dom.window.innerHeight = 600;
  scene.resizeCanvas();
  assert.strictEqual(scene.scale, 1);
  assert.strictEqual(scene.camera.width, 1200);
  assert.strictEqual(scene.camera.height, 600);
});
