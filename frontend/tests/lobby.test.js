import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Patch GameScene before importing startGame
let capturedUrl = null;
class FakeScene {
  constructor() {
    this.canvas = document.createElement("canvas");
  }
  initWebSocket(url) {
    capturedUrl = url;
  }
  startGame() {}
  update() {}
  render() {}
  handleKeyDown() {}
  handleKeyUp() {}
  handleMouseMove() {}
  handleMouseDown() {}
  handleMouseUp() {}
  resizeCanvas() {}
}

const dom = new JSDOM("<!DOCTYPE html><body></body>");
global.document = dom.window.document;
global.window = dom.window;
global.window.requestAnimationFrame = () => {};
global.requestAnimationFrame = () => {};

const main = await import("../src/main.js");
main.__setGameSceneClass(FakeScene);
const { startGame } = main;

test("startGame constructs websocket URL with gameId", () => {
  startGame("abc123");
  assert.ok(capturedUrl.endsWith("/abc123"));
});

test("startGame hides the main menu if present", () => {
  const menu = document.createElement("div");
  menu.id = "mainMenu";
  document.body.appendChild(menu);
  startGame("test-id");
  assert.strictEqual(menu.style.display, "none");
});
