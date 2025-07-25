import { GameScene } from "./scenes/game-scene.js";
import { setupLobby } from "./components/lobby.js";

let SceneClass = GameScene;
let scene;

function gameLoop() {
  scene.update();
  scene.render();
  requestAnimationFrame(gameLoop);
}

/**
 * Start a new game connected to the given session.
 *
 * @param {string} gameId - Identifier of the game session.
 * @returns {void}
 */
export function startGame(gameId) {
  scene = new SceneClass();
  const wsUrl = `ws://${window.location.hostname}:8000/ws/game/${gameId}`;
  scene.initWebSocket(wsUrl);

  // Hide splash screen so the canvas is visible once the session starts
  const menu = document.getElementById("mainMenu");
  if (menu) menu.style.display = "none";

  window.addEventListener("resize", () => scene.resizeCanvas());
  window.addEventListener("keydown", (e) => scene.handleKeyDown(e));
  window.addEventListener("keyup", (e) => scene.handleKeyUp(e));
  window.addEventListener("mousemove", (e) =>
    scene.setMousePos(e.clientX, e.clientY),
  );
  scene.canvas.addEventListener("mousedown", (e) => scene.handleMouseDown(e));
  scene.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  requestAnimationFrame(gameLoop);
}

/**
 * Override the internal GameScene constructor for testing purposes.
 *
 * @param {typeof GameScene} cls - Replacement class.
 * @returns {void}
 */
export function __setGameSceneClass(cls) {
  SceneClass = cls;
}

setupLobby(startGame);
