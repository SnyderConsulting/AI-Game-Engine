import {
  spawnZombie,
  moveZombie,
  moveTowards,
  isColliding,
  generateWalls,
  circleRectColliding,
  SEGMENT_SIZE,
} from "./game_logic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const restartBtn = document.getElementById("restartBtn");

const player = { x: canvas.width / 2, y: canvas.height / 2, speed: 2 };
let zombies = [];
let walls = [];
let spawnTimer = 0;
let gameOver = false;
const keys = {};

function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  zombies = [];
  walls = generateWalls(canvas.width, canvas.height, 4);
  spawnTimer = 0;
  gameOver = false;
  restartBtn.style.display = "none";
}

restartBtn.addEventListener("click", resetGame);

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function update() {
  if (gameOver) return;

  const prevX = player.x;
  const prevY = player.y;

  if (keys["arrowup"] || keys["w"]) player.y -= player.speed;
  if (keys["arrowdown"] || keys["s"]) player.y += player.speed;
  if (keys["arrowleft"] || keys["a"]) player.x -= player.speed;
  if (keys["arrowright"] || keys["d"]) player.x += player.speed;

  player.x = Math.max(10, Math.min(canvas.width - 10, player.x));
  player.y = Math.max(10, Math.min(canvas.height - 10, player.y));

  if (walls.some((w) => circleRectColliding(player, w, 10))) {
    player.x = prevX;
    player.y = prevY;
  }

  if (spawnTimer <= 0) {
    zombies.push(spawnZombie(canvas.width, canvas.height, walls));
    spawnTimer = 60;
  } else {
    spawnTimer--;
  }

  zombies.forEach((z) => {
    moveZombie(z, player, walls, 1, canvas.width, canvas.height);
    if (walls.some((w) => circleRectColliding(z, w, 10))) {
      // fallback in case of pathfinding error
      moveTowards(z, player, 1);
    }
    if (isColliding(z, player, 10)) {
      gameOver = true;
      restartBtn.style.display = "block";
    }
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "gray";
  walls.forEach((w) => {
    ctx.fillRect(w.x, w.y, SEGMENT_SIZE, SEGMENT_SIZE);
  });

  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "red";
  zombies.forEach((z) => {
    ctx.beginPath();
    ctx.arc(z.x, z.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  if (gameOver) {
    ctx.fillStyle = "black";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    restartBtn.style.display = "block";
  }
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", () => {
  resetGame();
  gameLoop();
});
