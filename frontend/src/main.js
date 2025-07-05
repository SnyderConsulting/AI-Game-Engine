import {
  spawnZombie,
  spawnPlayer,
  moveZombie,
  moveTowards,
  isColliding,
  generateWalls,
  circleRectColliding,
  SEGMENT_SIZE,
  updateTurrets,
  spawnWeapon,
  attackZombies,
  PLAYER_MAX_HEALTH,
  ZOMBIE_MAX_HEALTH,
} from "./game_logic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const restartBtn = document.getElementById("restartBtn");

const player = {
  x: 0,
  y: 0,
  speed: 2,
  health: PLAYER_MAX_HEALTH,
  damageCooldown: 0,
  weapon: null,
};
let zombies = [];
let turrets = [];
let walls = [];
let weapon = null;
let spawnTimer = 0;
let gameOver = false;
const keys = {};

function resetGame() {
  zombies = [];
  turrets = [];
  walls = generateWalls(canvas.width, canvas.height, 4);
  const spawn = spawnPlayer(canvas.width, canvas.height, walls);
  player.x = spawn.x;
  player.y = spawn.y;
  player.health = PLAYER_MAX_HEALTH;
  player.damageCooldown = 0;
  player.weapon = null;
  weapon = spawnWeapon(canvas.width, canvas.height, walls);
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

  if (player.damageCooldown > 0) player.damageCooldown--;

  player.x = Math.max(10, Math.min(canvas.width - 10, player.x));
  player.y = Math.max(10, Math.min(canvas.height - 10, player.y));

  if (walls.some((w) => circleRectColliding(player, w, 10))) {
    player.x = prevX;
    player.y = prevY;
  }

  if (weapon && isColliding(player, weapon, 10)) {
    player.weapon = weapon;
    weapon = null;
  }

  if (player.weapon && keys[" "]) {
    attackZombies(player, zombies, player.weapon.damage, 20);
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
    if (z.attackCooldown > 0) z.attackCooldown--;
    if (
      isColliding(z, player, 10) &&
      player.damageCooldown <= 0 &&
      z.attackCooldown <= 0
    ) {
      player.health--;
      player.damageCooldown = 30;
      z.attackCooldown = 30;
      if (player.health <= 0) {
        gameOver = true;
        restartBtn.style.display = "block";
      }
    }
  });

  updateTurrets(turrets, zombies);
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
  ctx.fillStyle = "black";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Health: ${player.health}`, 10, 20);

  if (weapon) {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(weapon.x, weapon.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "red";
  zombies.forEach((z) => {
    ctx.beginPath();
    ctx.arc(z.x, z.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillRect(z.x - 10, z.y - 16, 20, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(z.x - 10, z.y - 16, (z.health / ZOMBIE_MAX_HEALTH) * 20, 4);
    ctx.fillStyle = "red";
  });

  ctx.fillStyle = "blue";
  turrets.forEach((t) => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
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
