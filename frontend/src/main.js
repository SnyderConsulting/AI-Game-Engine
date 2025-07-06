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
  attackZombiesWithKills,
  PLAYER_MAX_HEALTH,
  ZOMBIE_MAX_HEALTH,
  createSpawnDoor,
  spawnZombieAtDoor,
} from "./game_logic.js";
import {
  createInventory,
  addItem,
  moveItem,
  moveToHotbar,
  consumeHotbarItem,
  countItem,
  removeItem,
} from "./inventory.js";
import { RECIPES, canCraft, craftRecipe } from "./crafting.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("mainMenu");
const startBtn = document.getElementById("startBtn");
const gameOverDiv = document.getElementById("gameOver");
const newGameBtn = document.getElementById("newGameBtn");
const inventoryDiv = document.getElementById("inventory");
const inventoryGrid = document.getElementById("inventoryGrid");
const inventoryBar = document.getElementById("inventoryBar");
const inventoryClose = document.getElementById("inventoryClose");
const hotbarDiv = document.getElementById("hotbar");
const pickupMsg = document.getElementById("pickupMessage");
const craftingDiv = document.getElementById("craftingMenu");
const craftingList = document.getElementById("craftingList");
const craftingBar = document.getElementById("craftingBar");
const craftingClose = document.getElementById("craftingClose");

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
let inventory = createInventory();
let inventoryOpen = false;
let craftingOpen = false;
let worldItems = [];
let pickupMessageTimer = 0;
let inventoryPos = { left: null, top: null };
let craftingPos = { left: null, top: null };

const ZOMBIE_DROPS = [
  { type: "core", chance: 0.1 },
  { type: "flesh", chance: 0.8 },
  { type: "teeth", chance: 0.4 },
];

let selectedSlot = null;

function renderInventory() {
  inventoryGrid.innerHTML = "";
  inventory.slots.forEach((slot, i) => {
    const div = document.createElement("div");
    div.dataset.index = i;
    Object.assign(div.style, {
      width: "40px",
      height: "40px",
      border: "1px solid white",
      color: "white",
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    if (selectedSlot === i) div.style.outline = "2px solid yellow";
    div.textContent = slot.item
      ? `${slot.item[0].toUpperCase()}:${slot.count}`
      : "";
    div.addEventListener("click", () => {
      if (selectedSlot === null) {
        selectedSlot = i;
      } else {
        moveItem(inventory, selectedSlot, i);
        selectedSlot = null;
      }
      renderInventory();
      renderHotbar();
    });
    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const idx = inventory.hotbar.findIndex((s) => !s.item);
      moveToHotbar(inventory, i, idx === -1 ? 0 : idx);
      selectedSlot = null;
      renderInventory();
      renderHotbar();
    });
    inventoryGrid.appendChild(div);
  });
}

function renderHotbar() {
  hotbarDiv.innerHTML = "";
  inventory.hotbar.forEach((slot) => {
    const div = document.createElement("div");
    Object.assign(div.style, {
      width: "40px",
      height: "40px",
      border: "1px solid white",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    div.textContent = slot.item
      ? `${slot.item[0].toUpperCase()}:${slot.count}`
      : "";
    hotbarDiv.appendChild(div);
  });
}

function renderCrafting() {
  craftingList.innerHTML = "";
  RECIPES.forEach((r) => {
    const hasAny = Object.keys(r.ingredients).some(
      (id) => countItem(inventory, id) > 0,
    );
    if (!hasAny) return;
    const container = document.createElement("div");
    container.style.border = "1px solid white";
    container.style.padding = "4px";
    container.style.marginBottom = "4px";
    const title = document.createElement("div");
    title.textContent = r.title;
    title.style.fontWeight = "bold";
    container.appendChild(title);
    const desc = document.createElement("div");
    desc.textContent = r.description;
    container.appendChild(desc);
    const req = document.createElement("div");
    Object.entries(r.ingredients).forEach(([id, qty]) => {
      const line = document.createElement("div");
      line.textContent = `${id} ${countItem(inventory, id)}/${qty}`;
      req.appendChild(line);
    });
    container.appendChild(req);
    if (canCraft(inventory, r)) {
      container.style.cursor = "pointer";
      container.addEventListener("click", () => {
        const added = craftRecipe(inventory, r);
        if (!added) {
          worldItems.push({ x: player.x, y: player.y, type: r.id, count: 1 });
        }
        renderInventory();
        renderCrafting();
        renderHotbar();
      });
    }
    craftingList.appendChild(container);
  });
}

function toggleInventory(open) {
  if (open === inventoryOpen) return;
  inventoryOpen = open;
  if (inventoryOpen) {
    if (inventoryPos.left !== null) {
      inventoryDiv.style.left = inventoryPos.left + "px";
      inventoryDiv.style.top = inventoryPos.top + "px";
      inventoryDiv.style.transform = "none";
    } else {
      inventoryDiv.style.left = "50%";
      inventoryDiv.style.top = "50%";
      inventoryDiv.style.transform = "translate(-50%, -50%)";
    }
    inventoryDiv.style.display = "block";
    renderInventory();
  } else {
    inventoryDiv.style.display = "none";
    inventoryPos = {
      left: inventoryDiv.offsetLeft,
      top: inventoryDiv.offsetTop,
    };
  }
}

function toggleCrafting(open) {
  if (open === craftingOpen) return;
  craftingOpen = open;
  if (craftingOpen) {
    if (craftingPos.left !== null) {
      craftingDiv.style.left = craftingPos.left + "px";
      craftingDiv.style.top = craftingPos.top + "px";
      craftingDiv.style.transform = "none";
    } else {
      craftingDiv.style.left = "50%";
      craftingDiv.style.top = "50%";
      craftingDiv.style.transform = "translate(-50%, -50%)";
    }
    craftingDiv.style.display = "block";
    renderCrafting();
  } else {
    craftingDiv.style.display = "none";
    craftingPos = { left: craftingDiv.offsetLeft, top: craftingDiv.offsetTop };
  }
}

function makeDraggable(div, bar, closeBtn, posStore, toggleFn) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  bar.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.clientX - div.offsetLeft;
    offsetY = e.clientY - div.offsetTop;
    div.style.transform = "none";
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    posStore.left = e.clientX - offsetX;
    posStore.top = e.clientY - offsetY;
    div.style.left = posStore.left + "px";
    div.style.top = posStore.top + "px";
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });
  closeBtn.addEventListener("click", () => toggleFn(false));
}

function dropLoot(zombie) {
  if (!zombie) return;
  ZOMBIE_DROPS.forEach((d) => {
    if (Math.random() < d.chance) {
      worldItems.push({ x: zombie.x, y: zombie.y, type: d.type, count: 1 });
    }
  });
}

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
  inventory = createInventory();
  worldItems = [];
  inventoryOpen = false;
  craftingOpen = false;
  pickupMessageTimer = 0;
  inventoryDiv.style.display = "none";
  craftingDiv.style.display = "none";
  pickupMsg.textContent = "";
  renderInventory();
  renderHotbar();
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
makeDraggable(
  inventoryDiv,
  inventoryBar,
  inventoryClose,
  inventoryPos,
  toggleInventory,
);
makeDraggable(
  craftingDiv,
  craftingBar,
  craftingClose,
  craftingPos,
  toggleCrafting,
);

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "i" || e.key === "e") {
    toggleInventory(!inventoryOpen);
  }
  if (e.key.toLowerCase() === "c") {
    toggleCrafting(!craftingOpen);
  }
  if (/^[1-5]$/.test(e.key)) {
    const used = consumeHotbarItem(inventory, parseInt(e.key) - 1);
    if (used) {
      pickupMsg.textContent = `Used ${used}`;
      pickupMessageTimer = 60;
      renderHotbar();
    }
  }
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

  for (let i = worldItems.length - 1; i >= 0; i--) {
    const it = worldItems[i];
    if (isColliding(player, it, 10)) {
      if (addItem(inventory, it.type, it.count)) {
        worldItems.splice(i, 1);
        pickupMsg.textContent = `Picked up ${it.type}`;
        pickupMessageTimer = 60;
        renderInventory();
        renderHotbar();
      }
    }
  }

  if (player.swingTimer > 0) player.swingTimer--;

  if (player.weapon && keys[" "] && player.swingTimer <= 0) {
    const killed = attackZombiesWithKills(
      player,
      zombies,
      player.weapon.damage,
      30,
      player.facing,
      Math.PI / 2,
      5,
    );
    killed.forEach(dropLoot);
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

  updateTurrets(turrets, zombies, dropLoot);

  if (pickupMessageTimer > 0) {
    pickupMessageTimer--;
    if (pickupMessageTimer === 0) pickupMsg.textContent = "";
  }
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

  ctx.fillStyle = "yellow";
  worldItems.forEach((it) => {
    ctx.beginPath();
    ctx.arc(it.x, it.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

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
