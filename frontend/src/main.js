import { GameScene } from "./scenes/game-scene.js";

const scene = new GameScene();

function gameLoop() {
  scene.update();
  scene.render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", () => scene.resizeCanvas());
window.addEventListener("keydown", (e) => scene.handleKeyDown(e));
window.addEventListener("keyup", (e) => scene.handleKeyUp(e));
scene.canvas.addEventListener("mousemove", (e) => scene.handleMouseMove(e));
scene.canvas.addEventListener("mousedown", (e) => scene.handleMouseDown(e));
scene.canvas.addEventListener("mouseup", (e) => scene.handleMouseUp(e));
scene.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

scene.startGame();
requestAnimationFrame(gameLoop);
