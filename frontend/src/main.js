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
  createSpawnDoor,
  spawnZombieAtDoor,
} from "./game_logic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("mainMenu");
const startBtn = document.getElementById("startBtn");
const gameOverDiv = document.getElementById("gameOver");
const newGameBtn = document.getElementById("newGameBtn");

const player = {
  x: 0,
  y: 0,
  speed: 2,
  health: PLAYER_MAX_HEALTH,
  damageCooldown: 0,
  weapon: null,
  facing: { x: 1, y: 0 },
  swingTimer: 0,
};
let zombies = [];
let turrets = [];
let walls = [];
let weapon = null;
let spawnTimer = 0;
let spawnDoor = null;
let gameOver = false;
const keys = {};
let loopStarted = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function startGame() {
  resizeCanvas();
  resetGame();
  if (!loopStarted) {
    loopStarted = true;
    gameLoop();
  }
}

function resetGame() {
  zombies = [];
  turrets = [];
  // Use more walls now that the canvas covers the full screen
  walls = generateWalls(canvas.width, canvas.height, 20);
  spawnDoor = createSpawnDoor(canvas.width, canvas.height, walls);
  const spawn = spawnPlayer(canvas.width, canvas.height, walls);
  player.x = spawn.x;
  player.y = spawn.y;
  player.health = PLAYER_MAX_HEALTH;
  player.damageCooldown = 0;
  player.weapon = null;
  weapon = spawnWeapon(canvas.width, canvas.height, walls);
  spawnTimer = 0;
  gameOver = false;
  gameOverDiv.style.display = "none";
}

startBtn.addEventListener("click", () => {
  mainMenu.style.display = "none";
  startGame();
});

newGameBtn.addEventListener("click", () => {
  gameOverDiv.style.display = "none";
  startGame();
});

window.addEventListener("resize", resizeCanvas);

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

  let moveX = 0;
  let moveY = 0;
  if (keys["arrowup"] || keys["w"]) moveY -= player.speed;
  if (keys["arrowdown"] || keys["s"]) moveY += player.speed;
  if (keys["arrowleft"] || keys["a"]) moveX -= player.speed;
  if (keys["arrowright"] || keys["d"]) moveX += player.speed;

  player.x += moveX;
  player.y += moveY;
  if (moveX !== 0 || moveY !== 0) {
    const len = Math.hypot(moveX, moveY);
    player.facing.x = moveX / len;
    player.facing.y = moveY / len;
  }

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

  if (player.swingTimer > 0) player.swingTimer--;

  if (player.weapon && keys[" "] && player.swingTimer <= 0) {
    attackZombies(
      player,
      zombies,
      player.weapon.damage,
      30,
      player.facing,
      Math.PI / 2,
      5,
    );
    player.swingTimer = 10;
  }

  if (spawnTimer <= 0) {
    zombies.push(spawnZombieAtDoor(spawnDoor));
    spawnTimer = 180 + Math.random() * 120;
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
        gameOverDiv.style.display = "block";
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
  if (spawnDoor) {
    ctx.fillStyle = "brown";
    ctx.fillRect(spawnDoor.x - 5, spawnDoor.y - 5, 10, 10);
  }

  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
  ctx.fill();

  if (player.swingTimer > 0) {
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 3;
    const startA = Math.atan2(player.facing.y, player.facing.x) - Math.PI / 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 25, startA, startA + Math.PI / 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
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

  // The overlay div already shows the Game Over message
  // and restart button, so nothing is drawn here when
  // the player loses.
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", resizeCanvas);
