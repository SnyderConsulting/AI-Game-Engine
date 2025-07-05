import { spawnZombie, moveTowards, isColliding } from "./game_logic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = { x: canvas.width / 2, y: canvas.height / 2, speed: 2 };
const zombies = [];
let spawnTimer = 0;
let gameOver = false;
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function update() {
  if (gameOver) return;

  if (keys["arrowup"] || keys["w"]) player.y -= player.speed;
  if (keys["arrowdown"] || keys["s"]) player.y += player.speed;
  if (keys["arrowleft"] || keys["a"]) player.x -= player.speed;
  if (keys["arrowright"] || keys["d"]) player.x += player.speed;

  player.x = Math.max(10, Math.min(canvas.width - 10, player.x));
  player.y = Math.max(10, Math.min(canvas.height - 10, player.y));

  if (spawnTimer <= 0) {
    zombies.push(spawnZombie(canvas.width, canvas.height));
    spawnTimer = 60;
  } else {
    spawnTimer--;
  }

  zombies.forEach((z) => {
    moveTowards(z, player, 1);
    if (isColliding(z, player, 10)) {
      gameOver = true;
    }
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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
  }
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", gameLoop);
