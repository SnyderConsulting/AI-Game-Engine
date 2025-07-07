import {
  spawnZombie,
  spawnPlayer,
  moveZombie,
  moveTowards,
  isColliding,
  generateWalls,
  circleRectColliding,
  SEGMENT_SIZE,
  spawnWeapon,
  attackZombies,
  attackZombiesWithKills,
  PLAYER_MAX_HEALTH,
  ZOMBIE_MAX_HEALTH,
  createSpawnDoor,
  spawnZombieAtDoor,
  spawnContainers,
} from "./game_logic.js";
import { createPlayer, resetPlayerForNewGame } from "./player.js";
import {
  createInventory,
  addItem,
  moveItem,
  moveToHotbar,
  moveFromHotbar,
  swapHotbar,
  swapInventoryHotbar,
  consumeHotbarItem,
  countItem,
  removeItem,
  setActiveHotbar,
  getActiveHotbarItem,
} from "./inventory.js";
import { RECIPES, canCraft, craftRecipe } from "./crafting.js";
import { dropLoot } from "./loot.js";
import {
  createFireball,
  updateFireballs,
  predictFireballEndpoint,
  fireballStats,
  updateExplosions,
} from "./spells.js";
import { createArrow, updateArrows, predictArrowEndpoint } from "./arrow.js";
import {
  upgradeFireball,
  upgradeFireOrb,
  upgradePhoenixRevival,
} from "./skill_tree.js";
import { createOrbs, updateOrbs } from "./orbs.js";
import { makeDraggable } from "./ui.js";

import { applyConsumableEffect, CONSUMABLE_ITEMS } from "./items.js";
import { getItemCooldown } from "./cooldowns.js";
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
const lootDiv = document.getElementById("lootProgress");
const lootFill = document.getElementById("lootFill");
const skillTreeDiv = document.getElementById("skillTree");
const skillTreeBar = document.getElementById("skillTreeBar");
const skillTreeClose = document.getElementById("skillTreeClose");
const skillPointsDiv = document.getElementById("skillPoints");
const skillGrid = document.getElementById("skillGrid");

// Mapping from item ids to icon paths. If an item is missing, a
// question mark will be shown instead of an image.
const ITEM_ICONS = {
  core: "assets/zombie_core.png",
  flesh: "assets/zombie_flesh.png",
  teeth: "assets/zombie_teeth.png",
  zombie_essence: "assets/zombie_essence.png",
  elemental_potion: "assets/elemental_potion.png",
  transformation_syringe: "assets/transformation_syringe.png",
  fire_core: "assets/fire_core.png",
  mutation_serum_fire: "assets/mutation_serum_fire.png",
  fireball_spell: "assets/skill_fireball.png",
  fire_orb_skill: "assets/skill_fire_orb.png",
  phoenix_revival_skill: "assets/skill_phoenix_revival.png",
  baseball_bat: "assets/baseball_bat.png",
  medkit: "assets/medkit.png",
  wood: "assets/wood.png",
  bow: "assets/wooden_bow.png",
  arrow: "assets/wooden_arrow.png",
};

// Preload image objects for item icons so they can be drawn on the canvas
const ITEM_IMAGES = {};
for (const [id, path] of Object.entries(ITEM_ICONS)) {
  const img = new Image();
  img.src = path;
  ITEM_IMAGES[id] = img;
}

const cardboardBoxImg = new Image();
cardboardBoxImg.src = "assets/cardboard_box.png";

const playerSprite = new Image();
playerSprite.src = "assets/sprite_player.png";
const zombieSprite = new Image();
zombieSprite.src = "assets/sprite_zombie.png";
const fireZombieSprite = new Image();
fireZombieSprite.src = "assets/sprite_fire_zombie.png";

function drawSprite(ctx, img, x, y, facing, size = 32) {
  const angle = Math.atan2(facing.y, facing.x) - Math.PI / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

const player = createPlayer(PLAYER_MAX_HEALTH);
let zombies = [];
let walls = [];
let weapon = null;
let spawnTimer = 0;
let spawnDoor = null;
let containers = [];
let looting = null;
let lootTimer = 0;
let gameOver = false;
const keys = {};
let loopStarted = false;
let inventory = createInventory();
let inventoryOpen = false;
let craftingOpen = false;
let skillTreeOpen = false;
let worldItems = [];
let fireballs = [];
let fireOrbs = [];
let arrows = [];
let explosions = [];
let fireballCooldown = 0;
let bowAiming = false;
let mousePos = { x: 0, y: 0 };
let pickupMessageTimer = 0;
let inventoryPos = { left: null, top: null };
let craftingPos = { left: null, top: null };
let skillTreePos = { left: null, top: null };

let prevUse = false;
let prevAim = false;
const LOOT_TIME = 180; // 3 seconds at 60fps
const LOOT_DIST = 20;
const MEDKIT_CHANCE = 0.5;

// When managing inventory/hotbar the user can select a slot.
// The structure is { type: "inventory" | "hotbar", index: number }.
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
      position: "relative",
    });
    if (
      selectedSlot &&
      selectedSlot.type === "inventory" &&
      selectedSlot.index === i
    )
      div.style.outline = "2px solid yellow";
    if (slot.item) {
      if (ITEM_ICONS[slot.item]) {
        const img = document.createElement("img");
        img.src = ITEM_ICONS[slot.item];
        img.style.width = "32px";
        img.style.height = "32px";
        div.appendChild(img);
      } else {
        div.textContent = "?";
      }
      if (slot.count > 1) {
        const count = document.createElement("span");
        count.textContent = slot.count;
        Object.assign(count.style, {
          position: "absolute",
          bottom: "0",
          right: "2px",
          fontSize: "10px",
        });
        div.appendChild(count);
      }

      const { remaining, max } = getItemCooldown(
        slot.item,
        player,
        fireballCooldown,
      );
      if (max > 0 && remaining > 0) {
        const deg = (remaining / max) * 360;
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
          position: "absolute",
          inset: "0",
          borderRadius: "2px",
          pointerEvents: "none",
          background: `conic-gradient(from -90deg, rgba(128,128,128,0.6) 0deg ${deg}deg, transparent ${deg}deg 360deg)`,
        });
        div.appendChild(overlay);
      }
    }
    div.addEventListener("mousedown", () => {
      if (!selectedSlot) {
        selectedSlot = { type: "inventory", index: i };
      } else {
        if (selectedSlot.type === "inventory") {
          moveItem(inventory, selectedSlot.index, i);
        } else {
          swapInventoryHotbar(inventory, i, selectedSlot.index);
        }
        selectedSlot = null;
      }
      renderInventory();
      renderHotbar();
    });
    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const slot = inventory.slots[i];
      if (!slot.item) return;
      const idx = inventory.hotbar.findIndex((s) => !s.item);
      if (idx !== -1) {
        moveToHotbar(inventory, i, idx);
        selectedSlot = null;
        renderInventory();
        renderHotbar();
      }
    });
    inventoryGrid.appendChild(div);
  });
  if (craftingOpen) renderCrafting();
}

function renderHotbar() {
  hotbarDiv.innerHTML = "";
  inventory.hotbar.forEach((slot, i) => {
    const div = document.createElement("div");
    Object.assign(div.style, {
      width: "40px",
      height: "40px",
      border: "1px solid white",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    });
    if (
      selectedSlot &&
      selectedSlot.type === "hotbar" &&
      selectedSlot.index === i
    )
      div.style.outline = "2px solid yellow";
    if (slot.item) {
      if (ITEM_ICONS[slot.item]) {
        const img = document.createElement("img");
        img.src = ITEM_ICONS[slot.item];
        img.style.width = "32px";
        img.style.height = "32px";
        div.appendChild(img);
      } else {
        div.textContent = "?";
      }
      if (slot.count > 1) {
        const count = document.createElement("span");
        count.textContent = slot.count;
        Object.assign(count.style, {
          position: "absolute",
          bottom: "0",
          right: "2px",
          fontSize: "10px",
        });
        div.appendChild(count);
      }
      const { remaining, max } = getItemCooldown(
        slot.item,
        player,
        fireballCooldown,
      );
      if (max > 0 && remaining > 0) {
        const deg = (remaining / max) * 360;
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
          position: "absolute",
          inset: "0",
          borderRadius: "2px",
          pointerEvents: "none",
          background: `conic-gradient(from -90deg, rgba(128,128,128,0.6) 0deg ${deg}deg, transparent ${deg}deg 360deg)`,
        });
        div.appendChild(overlay);
      }
    }
    if (i === inventory.active) {
      div.style.borderColor = "yellow";
    }
    div.addEventListener("mousedown", () => {
      if (!selectedSlot) {
        selectedSlot = { type: "hotbar", index: i };
      } else {
        if (selectedSlot.type === "hotbar") {
          swapHotbar(inventory, selectedSlot.index, i);
        } else {
          swapInventoryHotbar(inventory, selectedSlot.index, i);
        }
        selectedSlot = null;
      }
      renderInventory();
      renderHotbar();
    });
    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const idx = inventory.slots.findIndex((s) => !s.item);
      if (idx !== -1) {
        moveFromHotbar(inventory, i, idx);
        selectedSlot = null;
        renderInventory();
        renderHotbar();
      }
    });
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
    container.style.display = "flex";
    container.style.gap = "6px";

    const icon = document.createElement("img");
    if (ITEM_ICONS[r.id]) {
      icon.src = ITEM_ICONS[r.id];
    }
    icon.style.width = "40px";
    icon.style.height = "40px";
    container.appendChild(icon);

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = r.title;
    title.style.fontWeight = "bold";
    info.appendChild(title);
    const desc = document.createElement("div");
    desc.textContent = r.description;
    info.appendChild(desc);

    const req = document.createElement("div");
    Object.entries(r.ingredients).forEach(([id, qty]) => {
      const line = document.createElement("div");
      const ingIcon = document.createElement("img");
      if (ITEM_ICONS[id]) ingIcon.src = ITEM_ICONS[id];
      ingIcon.style.width = "16px";
      ingIcon.style.height = "16px";
      ingIcon.style.marginRight = "4px";
      line.appendChild(ingIcon);
      const text = document.createElement("span");
      text.textContent = `${countItem(inventory, id)}/${qty}`;
      line.appendChild(text);
      req.appendChild(line);
    });
    info.appendChild(req);
    container.appendChild(info);
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
    inventoryPos = {
      left: inventoryDiv.offsetLeft,
      top: inventoryDiv.offsetTop,
    };
    inventoryDiv.style.display = "none";
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
    craftingPos = { left: craftingDiv.offsetLeft, top: craftingDiv.offsetTop };
    craftingDiv.style.display = "none";
  }
}

function renderSkillTree() {
  skillPointsDiv.textContent = `Fire Mutation Points Available: ${player.fireMutationPoints}`;
  skillGrid.innerHTML = "";
  const skills = [
    {
      key: "fire_orb_skill",
      level: player.abilities.fireOrbLevel,
      max: 3,
      costs: [0, 1, 2, 3],
      upgrade: () => upgradeFireOrb(player),
    },
    {
      key: "fireball_spell",
      level: player.abilities.fireballLevel,
      max: 3,
      costs: [0, 2, 2, 3],
      upgrade: () => upgradeFireball(player, inventory, addItem, moveToHotbar),
    },
    {
      key: "phoenix_revival_skill",
      level: player.abilities.phoenixRevivalLevel,
      max: 3,
      costs: [0, 4, 3, 4],
      upgrade: () => upgradePhoenixRevival(player),
    },
  ];
  skills.forEach((s) => {
    const tile = document.createElement("div");
    const nextCost = s.level < s.max ? s.costs[s.level + 1] : null;
    Object.assign(tile.style, {
      width: "60px",
      height: "60px",
      border: "1px solid white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      cursor:
        nextCost && player.fireMutationPoints >= nextCost
          ? "pointer"
          : "default",
      background: s.level > 0 ? "rgba(255,255,255,0.1)" : "none",
    });
    const img = document.createElement("img");
    img.src = ITEM_ICONS[s.key];
    img.style.width = "48px";
    img.style.height = "48px";
    img.style.opacity = s.level > 0 ? 1 : 0.5;
    tile.appendChild(img);
    const label = document.createElement("div");
    label.style.fontSize = "10px";
    label.textContent = `Lv ${s.level}/${s.max}`;
    tile.appendChild(label);
    if (nextCost) {
      const costDiv = document.createElement("div");
      costDiv.style.fontSize = "10px";
      costDiv.textContent = `Cost: ${nextCost}`;
      tile.appendChild(costDiv);
    }
    if (nextCost && player.fireMutationPoints >= nextCost) {
      tile.addEventListener("mousedown", () => {
        if (s.upgrade()) {
          renderInventory();
          renderHotbar();
          renderSkillTree();
        }
      });
    }
    skillGrid.appendChild(tile);
  });
}

function toggleSkillTree(open) {
  if (open === skillTreeOpen) return;
  skillTreeOpen = open;
  if (skillTreeOpen) {
    if (skillTreePos.left !== null) {
      skillTreeDiv.style.left = skillTreePos.left + "px";
      skillTreeDiv.style.top = skillTreePos.top + "px";
      skillTreeDiv.style.transform = "none";
    } else {
      skillTreeDiv.style.left = "50%";
      skillTreeDiv.style.top = "50%";
      skillTreeDiv.style.transform = "translate(-50%, -50%)";
    }
    skillTreeDiv.style.display = "block";
    renderSkillTree();
  } else {
    skillTreePos = {
      left: skillTreeDiv.offsetLeft,
      top: skillTreeDiv.offsetTop,
    };
    skillTreeDiv.style.display = "none";
  }
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
  // Use more walls now that the canvas covers the full screen
  walls = generateWalls(canvas.width, canvas.height, 20);
  spawnDoor = createSpawnDoor(canvas.width, canvas.height, walls);
  const spawn = spawnPlayer(canvas.width, canvas.height, walls);
  player.x = spawn.x;
  player.y = spawn.y;
  resetPlayerForNewGame(player, PLAYER_MAX_HEALTH);
  weapon = spawnWeapon(canvas.width, canvas.height, walls, "baseball_bat", 1);
  spawnTimer = 0;
  containers = spawnContainers(
    canvas.width,
    canvas.height,
    walls,
    15 + Math.floor(Math.random() * 6),
  );
  looting = null;
  lootTimer = 0;
  gameOver = false;
  gameOverDiv.style.display = "none";
  inventory = createInventory();
  worldItems = [];
  fireballs = [];
  fireOrbs = [];
  explosions = [];
  fireballCooldown = 0;
  if (player.abilities.fireball) {
    addItem(inventory, "fireball_spell", 1);
    const idx = inventory.slots.findIndex((s) => s.item === "fireball_spell");
    if (idx !== -1) moveToHotbar(inventory, idx, 0);
  }
  if (player.abilities.fireOrb) {
    fireOrbs = createOrbs(player.abilities.fireOrbLevel >= 2 ? 2 : 1);
  }
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
makeDraggable(
  skillTreeDiv,
  skillTreeBar,
  skillTreeClose,
  skillTreePos,
  toggleSkillTree,
);

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if (key === "i" || key === "e") {
    toggleInventory(!inventoryOpen);
  }
  if (key === "c") {
    toggleCrafting(!craftingOpen);
  }
  if (key === "k") {
    toggleSkillTree(!skillTreeOpen);
  }
  if (/^[1-5]$/.test(key)) {
    const idx = parseInt(key) - 1;
    setActiveHotbar(inventory, idx);
    renderHotbar();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function update() {
  if (gameOver) return;

  if (player.phoenixCooldown > 0) player.phoenixCooldown--;
  if (player.damageBuffTimer > 0) {
    player.damageBuffTimer--;
    if (player.damageBuffTimer <= 0) player.damageBuffMult = 1;
  }

  const activeSlot = getActiveHotbarItem(inventory);
  if (activeSlot && activeSlot.item === "baseball_bat") {
    player.weapon = { type: "baseball_bat", damage: 1 };
  } else if (activeSlot && activeSlot.item === "bow") {
    player.weapon = { type: "bow" };
  } else {
    player.weapon = null;
  }

  const useHeld = keys[" "] || keys.mouse;
  const useTrigger = useHeld && !prevUse;
  prevUse = useHeld;
  const aimHeld = keys[" "] || keys.mouse2;
  const aimRelease = !aimHeld && prevAim;
  prevAim = aimHeld;

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
  const toMouseX = mousePos.x - player.x;
  const toMouseY = mousePos.y - player.y;
  const len = Math.hypot(toMouseX, toMouseY);
  if (len > 0) {
    player.facing.x = toMouseX / len;
    player.facing.y = toMouseY / len;
  }

  if (player.damageCooldown > 0) player.damageCooldown--;

  player.x = Math.max(10, Math.min(canvas.width - 10, player.x));
  player.y = Math.max(10, Math.min(canvas.height - 10, player.y));

  if (walls.some((w) => circleRectColliding(player, w, 10))) {
    player.x = prevX;
    player.y = prevY;
  }

  if (weapon && isColliding(player, weapon, 10)) {
    addItem(inventory, weapon.type, 1);
    const idx = inventory.slots.findIndex((s) => s.item === weapon.type);
    if (idx !== -1) moveToHotbar(inventory, idx, 0);
    weapon = null;
    renderInventory();
    renderHotbar();
  }

  if (!looting && keys["f"]) {
    const cont = containers.find(
      (c) =>
        Math.hypot(c.x - player.x, c.y - player.y) <= LOOT_DIST &&
        (!c.opened || c.item),
    );
    if (cont) {
      looting = cont;
      lootTimer = LOOT_TIME;
      lootFill.style.width = "0%";
      lootDiv.style.display = "block";
    }
  }

  if (looting) {
    const dist = Math.hypot(looting.x - player.x, looting.y - player.y);
    if (dist > LOOT_DIST || !keys["f"]) {
      looting = null;
      lootDiv.style.display = "none";
    } else {
      lootTimer--;
      lootFill.style.width = `${((LOOT_TIME - lootTimer) / LOOT_TIME) * 100}%`;
      if (lootTimer <= 0) {
        if (!looting.opened) {
          looting.opened = true;
          looting.item = Math.random() < MEDKIT_CHANCE ? "medkit" : "wood";
        }
        if (addItem(inventory, looting.item, 1)) {
          pickupMsg.textContent = `Picked up ${looting.item}`;
          looting.item = null;
          pickupMessageTimer = 60;
          renderInventory();
          renderHotbar();
        } else {
          pickupMsg.textContent = "Inventory Full";
          pickupMessageTimer = 60;
        }
        looting = null;
        lootDiv.style.display = "none";
      }
    }
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

  if (fireballCooldown > 0) fireballCooldown--;

  if (
    activeSlot &&
    activeSlot.item === "fireball_spell" &&
    player.abilities.fireball &&
    useHeld &&
    fireballCooldown <= 0
  ) {
    if (countItem(inventory, "fire_core") > 0) {
      removeItem(inventory, "fire_core", 1);
      const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
      const fb = createFireball(
        player.x,
        player.y,
        dir,
        player.abilities.fireballLevel,
        player.damageBuffMult,
      );
      if (fb) fireballs.push(fb);
      fireballCooldown = 15;
      renderInventory();
      renderHotbar();
    } else {
      pickupMsg.textContent = "Out of Fire Cores!";
      pickupMessageTimer = 60;
    }
  }

  if (player.weapon && player.weapon.type === "bow") {
    bowAiming = aimHeld;
    if (aimRelease) {
      const arrowsLeft = countItem(inventory, "arrow");
      if (arrowsLeft > 0) {
        removeItem(inventory, "arrow", 1);
        const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
        const a = createArrow(player.x, player.y, dir, player.damageBuffMult);
        if (a) arrows.push(a);
        renderInventory();
        renderHotbar();
      } else {
        pickupMsg.textContent = "Out of Arrows!";
        pickupMessageTimer = 60;
      }
    }
  } else {
    bowAiming = false;
  }

  if (
    player.weapon &&
    player.weapon.type === "baseball_bat" &&
    useHeld &&
    player.swingTimer <= 0
  ) {
    const killed = attackZombiesWithKills(
      player,
      zombies,
      player.weapon.damage * player.damageBuffMult,
      30,
      player.facing,
      Math.PI / 2,
      5,
    );
    killed.forEach((z) => dropLoot(z, worldItems));
    player.swingTimer = 10;
  }

  if (useTrigger && activeSlot && CONSUMABLE_ITEMS.has(activeSlot.item)) {
    const used = consumeHotbarItem(inventory, inventory.active);
    if (used) {
      applyConsumableEffect(player, used);
      pickupMsg.textContent = `Used ${used}`;
      pickupMessageTimer = 60;
      renderInventory();
      renderHotbar();
    }
  }

  if (spawnTimer <= 0) {
    zombies.push(spawnZombieAtDoor(spawnDoor));
    spawnTimer = 180 + Math.random() * 120;
  } else {
    spawnTimer--;
  }

  zombies.forEach((z) => {
    moveZombie(z, player, walls, 1, canvas.width, canvas.height);
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
        if (player.abilities.phoenixRevival && player.phoenixCooldown <= 0) {
          const lvl = player.abilities.phoenixRevivalLevel;
          const hpPerc = [0, 0.1, 0.3, 0.5][lvl];
          const dmg = [0, 1.25, 1.35, 1.5][lvl];
          const dur = [0, 300, 480, 720][lvl];
          player.health = Math.max(1, Math.round(PLAYER_MAX_HEALTH * hpPerc));
          player.phoenixCooldown = 7200;
          player.damageBuffMult = dmg;
          player.damageBuffTimer = dur;
        } else {
          gameOver = true;
          gameOverDiv.style.display = "block";
        }
      }
    }
  });

  if (player.abilities.fireOrb) {
    updateOrbs(fireOrbs, player, zombies, player.abilities.fireOrbLevel, (z) =>
      dropLoot(z, worldItems),
    );
  }

  updateFireballs(fireballs, zombies, walls, explosions, (z) =>
    dropLoot(z, worldItems),
  );
  updateExplosions(explosions);
  updateArrows(arrows, zombies, walls, (z) => dropLoot(z, worldItems));
  if (pickupMessageTimer > 0) {
    pickupMessageTimer--;
    if (pickupMessageTimer === 0) pickupMsg.textContent = "";
  }

  if (skillTreeOpen) renderSkillTree();

  renderHotbar();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "gray";
  walls.forEach((w) => {
    ctx.fillRect(w.x, w.y, SEGMENT_SIZE, SEGMENT_SIZE);
  });
  containers.forEach((c) => {
    ctx.globalAlpha = c.opened ? 0.5 : 1;
    ctx.drawImage(cardboardBoxImg, c.x - 10, c.y - 10, 20, 20);
    ctx.globalAlpha = 1;
  });
  if (spawnDoor) {
    ctx.fillStyle = "brown";
    ctx.fillRect(spawnDoor.x - 5, spawnDoor.y - 5, 10, 10);
  }

  drawSprite(ctx, playerSprite, player.x, player.y, player.facing);

  if (player.abilities.fireOrb) {
    ctx.fillStyle = "orange";
    fireOrbs.forEach((o) => {
      if (o.cooldown <= 0) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

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
  if (player.weapon && player.weapon.type === "bow") {
    ctx.fillText(`Arrows: ${countItem(inventory, "arrow")}`, 10, 40);
  }

  if (weapon) {
    const img = ITEM_IMAGES[weapon.type];
    if (img) {
      ctx.drawImage(img, weapon.x - 8, weapon.y - 8, 16, 16);
    } else {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(weapon.x, weapon.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "yellow";
  worldItems.forEach((it) => {
    ctx.beginPath();
    ctx.arc(it.x, it.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "brown";
  arrows.forEach((a) => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  const aimingBow =
    player.weapon && player.weapon.type === "bow" && (keys[" "] || keys.mouse2);
  if (aimingBow) {
    const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
    const end = predictArrowEndpoint(player.x, player.y, dir, walls, zombies);
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  const activeSlot = getActiveHotbarItem(inventory);
  if (
    activeSlot &&
    activeSlot.item === "fireball_spell" &&
    player.abilities.fireball
  ) {
    const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
    const end = predictFireballEndpoint(
      player.x,
      player.y,
      dir,
      walls,
      zombies,
    );
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([2, 4]);
    const { radius } = fireballStats(player.abilities.fireballLevel);
    ctx.beginPath();
    ctx.arc(end.x, end.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "orange";
  fireballs.forEach((fb) => {
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(255,0,0,0.5)";
  explosions.forEach((ex) => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  zombies.forEach((z) => {
    if (z.variant === "fire") {
      const grad = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, 20);
      grad.addColorStop(0, "rgba(255,100,0,0.8)");
      grad.addColorStop(1, "rgba(255,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(z.x, z.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    const img = z.variant === "fire" ? fireZombieSprite : zombieSprite;
    drawSprite(ctx, img, z.x, z.y, z.facing);
    ctx.fillStyle = "red";
    ctx.fillRect(z.x - 10, z.y - 16, 20, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(z.x - 10, z.y - 16, (z.health / ZOMBIE_MAX_HEALTH) * 20, 4);
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
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) keys.mouse = true;
  if (e.button === 2) {
    keys.mouse2 = true;
    e.preventDefault();
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (e.button === 0) keys.mouse = false;
  if (e.button === 2) keys.mouse2 = false;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
