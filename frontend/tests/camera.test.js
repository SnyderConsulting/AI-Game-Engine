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
    <div id="skillTree"></div>
    <div id="pickupMessage"></div>
    <div id="waveCounter"></div>`,
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
