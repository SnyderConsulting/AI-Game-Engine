import {
  spawnPlayer,
  SEGMENT_SIZE,
  PLAYER_MAX_HEALTH,
  createSpawnDoor,
  spawnContainers,
  openContainer,
} from "../game_logic.js";
import {
  circleRectColliding,
  checkAllCollisions,
} from "../systems/collision-system.js";
import { moveTowards, isColliding } from "../utils/geometry.js";
import {
  spawnZombieWave,
  updateZombies,
  attackZombiesWithKills,
} from "../entities/zombie.js";
import {
  generateStoreWalls,
  damageWall,
  updateWalls,
  wallSwingHit,
  openShelf,
} from "../entities/walls.js";
import {
  createPlayer,
  resetPlayerForNewGame,
  tryPhoenixRevival,
} from "../entities/player.js";
import {
  createInventory,
  addItem,
  moveToHotbar,
  consumeHotbarItem,
  getActiveHotbarItem,
  setActiveHotbar,
} from "../systems/inventory-system.js";
import { RECIPES, canCraft, craftRecipe } from "../systems/crafting-system.js";
import { dropLoot } from "../loot.js";
import { SKILL_INFO, SKILL_UPGRADERS } from "../systems/skill-tree-system.js";
import { createOrbs } from "../entities/orbs.js";
import { updateAbilities } from "../systems/ability-system.js";
import { render as renderScene } from "../systems/rendering-system.js";
import { makeDraggable } from "../ui.js";
import { createInventoryUI } from "../components/inventory-ui.js";
import { createSkillTreeUI } from "../components/skill-tree-ui.js";
import { createHUD } from "../components/hud.js";
import { createCraftingUI } from "../components/crafting-ui.js";
import {
  applyConsumableEffect,
  CONSUMABLE_ITEMS,
  ITEM_ICONS,
  CRAFTING_MATERIALS,
} from "../items.js";
import { getItemCooldown } from "../cooldowns.js";

export class GameScene {
  /**
   * Create a new game scene and set up all DOM references and default state.
   *
   * This initializes player data, UI components and internal arrays so the
   * scene is ready to start when the user begins a game.
   */
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.mainMenu = document.getElementById("mainMenu");
    this.startBtn = document.getElementById("startBtn");
    this.gameOverDiv = document.getElementById("gameOver");
    this.newGameBtn = document.getElementById("newGameBtn");
    this.victoryDiv = document.getElementById("victory");
    this.victoryBtn = document.getElementById("victoryBtn");
    this.waveCounterDiv = document.getElementById("waveCounter");

    this.inventoryDiv = document.getElementById("inventory");
    this.inventoryGrid = document.getElementById("inventoryGrid");
    this.inventoryBar = document.getElementById("inventoryBar");
    this.inventoryClose = document.getElementById("inventoryClose");
    this.hotbarDiv = document.getElementById("hotbar");

    this.pickupMsg = document.getElementById("pickupMessage");
    this.craftingDiv = document.getElementById("craftingMenu");
    this.craftingList = document.getElementById("craftingList");
    this.craftingBar = document.getElementById("craftingBar");
    this.craftingClose = document.getElementById("craftingClose");
    this.lootDiv = document.getElementById("lootProgress");
    this.lootFill = document.getElementById("lootFill");
    this.skillTreeDiv = document.getElementById("skillTree");
    this.skillTreeBar = document.getElementById("skillTreeBar");
    this.skillTreeClose = document.getElementById("skillTreeClose");
    this.skillPointsDiv = document.getElementById("skillPoints");
    this.skillGrid = document.getElementById("skillGrid");
    this.skillDetails = document.getElementById("skillDetails");
    this.skillNameDiv = document.getElementById("skillName");
    this.skillDescDiv = document.getElementById("skillDesc");
    this.skillLevelsDiv = document.getElementById("skillLevels");
    this.skillLevelDiv = document.getElementById("skillLevel");
    this.skillCostDiv = document.getElementById("skillCost");
    this.skillUpgradeBtn = document.getElementById("skillUpgrade");

    this.ITEM_IMAGES = {};
    for (const [id, path] of Object.entries(ITEM_ICONS)) {
      const img = new Image();
      img.src = path;
      this.ITEM_IMAGES[id] = img;
    }

    this.MATERIAL_DROPS = {
      plastic: "plastic_fragments",
      wood: "wood_planks",
      steel: "steel_plates",
    };

    this.cardboardBoxImg = new Image();
    this.cardboardBoxImg.src = "assets/cardboard_box.png";

    this.hud = createHUD({
      pickupMsg: this.pickupMsg,
      waveCounterDiv: this.waveCounterDiv,
    });

    this.playerSprite = new Image();
    this.playerSprite.src = "assets/sprite_player.png";
    this.zombieSprite = new Image();
    this.zombieSprite.src = "assets/sprite_zombie.png";
    this.fireZombieSprite = new Image();
    this.fireZombieSprite.src = "assets/sprite_fire_zombie.png";

    this.player = createPlayer(PLAYER_MAX_HEALTH);
    this.zombies = [];
    this.walls = [];
    this.weapon = null;
    this.spawnDoor = null;
    this.containers = [];
    this.looting = null;
    this.lootTimer = 0;
    this.gameOver = false;
    this.victory = false;
    this.currentWave = 1;
    this.keys = {};
    this.inventory = createInventory();
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.skillTreeOpen = false;
    this.worldItems = [];
    this.fireballs = [];
    this.fireOrbs = [];
    this.arrows = [];
    this.explosions = [];
    this.fireballCooldown = 0;
    this.bowAiming = false;
    this.mousePos = { x: 0, y: 0 };
    this.inventoryPos = { left: null, top: null };
    this.craftingPos = { left: null, top: null };
    this.skillTreePos = { left: null, top: null };
    this.prevUse = false;
    this.prevAim = false;
    this.LOOT_TIME = 180;
    this.LOOT_DIST = 20;

    this.inventoryUI = createInventoryUI({
      inventoryDiv: this.inventoryDiv,
      inventoryGrid: this.inventoryGrid,
      hotbarDiv: this.hotbarDiv,
      inventoryBar: this.inventoryBar,
      inventoryClose: this.inventoryClose,
      inventoryPos: this.inventoryPos,
    });

    this.skillTreeUI = createSkillTreeUI(
      {
        skillTreeDiv: this.skillTreeDiv,
        skillTreeBar: this.skillTreeBar,
        skillTreeClose: this.skillTreeClose,
        skillPointsDiv: this.skillPointsDiv,
        skillGrid: this.skillGrid,
        skillDetails: this.skillDetails,
        skillNameDiv: this.skillNameDiv,
        skillDescDiv: this.skillDescDiv,
        skillLevelsDiv: this.skillLevelsDiv,
        skillLevelDiv: this.skillLevelDiv,
        skillCostDiv: this.skillCostDiv,
        skillUpgradeBtn: this.skillUpgradeBtn,
        skillTreePos: this.skillTreePos,
      },
      ITEM_ICONS,
    );

    this.craftingUI = createCraftingUI(
      {
        craftingDiv: this.craftingDiv,
        craftingList: this.craftingList,
        craftingBar: this.craftingBar,
        craftingClose: this.craftingClose,
        craftingPos: this.craftingPos,
      },
      {
        renderInventory: () => this.renderInventory(),
        renderHotbar: () => this.renderHotbar(),
      },
    );

    makeDraggable(
      this.inventoryDiv,
      this.inventoryBar,
      this.inventoryClose,
      this.inventoryPos,
      (o) => this.toggleInventory(o),
    );
    makeDraggable(
      this.craftingDiv,
      this.craftingBar,
      this.craftingClose,
      this.craftingPos,
      (o) => this.toggleCrafting(o),
    );
    makeDraggable(
      this.skillTreeDiv,
      this.skillTreeBar,
      this.skillTreeClose,
      this.skillTreePos,
      (o) => this.toggleSkillTree(o),
    );

    this.skillUpgradeBtn.addEventListener("click", () =>
      this.handleSkillUpgrade(),
    );
    this.startBtn.addEventListener("click", () => {
      this.mainMenu.style.display = "none";
      this.startGame();
    });
    this.newGameBtn.addEventListener("click", () => {
      this.gameOverDiv.style.display = "none";
      this.startGame();
    });
    this.victoryBtn.addEventListener("click", () => {
      this.victoryDiv.style.display = "none";
      this.startGame();
    });
    this.resizeCanvas();
    this.initWebSocket();
  }

  /**
   * Resize the canvas element to match the current window dimensions.
   *
   * @returns {void}
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Establish a WebSocket connection to the backend.
   *
   * Logs connection lifecycle events for debugging.
   * @returns {void}
   */
  initWebSocket() {
    this.ws = new WebSocket("ws://localhost:8000/ws/game");
    this.ws.addEventListener("open", () => {
      console.log("Connected to game WebSocket");
    });
    this.ws.addEventListener("message", (e) => {
      this.handleServerMessage(e.data);
    });
    this.ws.addEventListener("close", () => {
      console.log("Game WebSocket closed");
    });
    this.ws.addEventListener("error", (err) => {
      console.error("Game WebSocket error", err);
    });
  }

  /**
   * Update local player state based on a WebSocket message.
   *
   * @param {string} data - JSON encoded game state from the server.
   * @returns {void}
   */
  handleServerMessage(data) {
    try {
      const state = JSON.parse(data);
      const ids = Object.keys(state.players || {});
      if (ids.length === 0) return;
      const serverPlayer = state.players[ids[0]];
      if (!serverPlayer) return;
      this.player.x = serverPlayer.x;
      this.player.y = serverPlayer.y;
      const map = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      };
      if (map[serverPlayer.facing]) {
        this.player.facing.x = map[serverPlayer.facing].x;
        this.player.facing.y = map[serverPlayer.facing].y;
      }
    } catch (err) {
      console.error("Failed to parse server state", err);
    }
  }

  /**
   * Begin a new game by resizing the canvas and resetting all entities.
   *
   * @returns {void}
   */
  startGame() {
    this.resizeCanvas();
    this.resetGame();
  }

  /**
   * Reset all game entities and state variables to their initial values.
   *
   * Called when starting a new game or restarting after game over.
   * @returns {void}
   */
  resetGame() {
    this.zombies = [];
    this.walls = generateStoreWalls(this.canvas.width, this.canvas.height);
    this.spawnDoor = createSpawnDoor(
      this.canvas.width,
      this.canvas.height,
      this.walls,
    );
    const spawn = spawnPlayer(
      this.canvas.width,
      this.canvas.height,
      this.walls,
    );
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.zombies = spawnZombieWave(
      5,
      this.spawnDoor,
      this.canvas.width,
      this.canvas.height,
      "normal",
      this.walls,
    );
    this.currentWave = 1;
    this.victory = false;
    this.hud.setWave(this.currentWave);
    this.hud.showWaveCounter();
    this.victoryDiv.style.display = "none";
    resetPlayerForNewGame(this.player, PLAYER_MAX_HEALTH);
    this.weapon = null;
    this.containers = spawnContainers(
      this.canvas.width,
      this.canvas.height,
      this.walls,
      15 + Math.floor(Math.random() * 6),
    );
    this.looting = null;
    this.lootTimer = 0;
    this.gameOver = false;
    this.gameOverDiv.style.display = "none";
    this.inventory = createInventory();
    this.worldItems = [];
    this.fireballs = [];
    this.fireOrbs = [];
    this.explosions = [];
    this.fireballCooldown = 0;
    if (this.player.abilities.fireball) {
      addItem(this.inventory, "fireball_spell", 1);
      const idx = this.inventory.slots.findIndex(
        (s) => s.item === "fireball_spell",
      );
      if (idx !== -1) moveToHotbar(this.inventory, idx, 0);
    }
    if (this.player.abilities.fireOrb) {
      this.fireOrbs = createOrbs(
        this.player.abilities.fireOrbLevel >= 2 ? 2 : 1,
      );
    }
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.inventoryDiv.style.display = "none";
    this.craftingDiv.style.display = "none";
    this.hud.clearPickupMessage();
    this.hud.setWave(this.currentWave);
    this.hud.showWaveCounter();
    this.renderInventory();
    this.renderHotbar();
  }

  /**
   * Upgrade the currently selected skill if the player meets the requirements.
   *
   * Updates inventory and UI when a skill level increases.
   * @returns {void}
   */
  handleSkillUpgrade() {
    const sel = this.skillTreeUI.getSelectedSkill();
    if (!sel) return;
    const upgrader = SKILL_UPGRADERS[sel.id];
    if (
      upgrader &&
      upgrader(this.player, this.inventory, addItem, moveToHotbar)
    ) {
      if (sel.id === "fire_orb_skill") {
        this.fireOrbs = createOrbs(
          this.player.abilities.fireOrbLevel >= 2 ? 2 : 1,
        );
      }
      this.renderInventory();
      this.renderHotbar();
      this.skillTreeUI.updateSkillDetails(this.player);
      this.skillTreeUI.renderSkillTree(this.player, SKILL_INFO);
    }
  }

  /**
   * Respond to keyboard presses and toggle UI or hotbar slots.
   *
   * @param {KeyboardEvent} e - The keydown event.
   * @returns {void}
   */
  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    if (key === "i" || key === "e") this.toggleInventory(!this.inventoryOpen);
    if (key === "c") this.toggleCrafting(!this.craftingOpen);
    if (key === "k") this.toggleSkillTree(!this.skillTreeOpen);
    if (/^[1-5]$/.test(key)) {
      const idx = parseInt(key) - 1;
      setActiveHotbar(this.inventory, idx);
      this.renderHotbar();
    }
  }

  /**
   * Stop tracking a key once it is released.
   *
   * @param {KeyboardEvent} e - The keyup event.
   * @returns {void}
   */
  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  /**
   * Update the cached mouse position relative to the canvas.
   *
   * @param {MouseEvent} e - The mousemove event.
   * @returns {void}
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
  }

  /**
   * Track mouse button presses for attacking or aiming actions.
   *
   * @param {MouseEvent} e - The mousedown event.
   * @returns {void}
   */
  handleMouseDown(e) {
    if (e.button === 0) this.keys.mouse = true;
    if (e.button === 2) {
      this.keys.mouse2 = true;
      e.preventDefault();
    }
  }

  /**
   * Clear mouse button states when released.
   *
   * @param {MouseEvent} e - The mouseup event.
   * @returns {void}
   */
  handleMouseUp(e) {
    if (e.button === 0) this.keys.mouse = false;
    if (e.button === 2) this.keys.mouse2 = false;
  }

  /**
   * Render the inventory panel and crafting menu when open.
   *
   * @returns {void}
   */
  renderInventory() {
    this.inventoryUI.renderInventory(
      this.inventory,
      this.player,
      this.fireballCooldown,
      ITEM_ICONS,
      getItemCooldown,
    );
    if (this.craftingOpen)
      this.craftingUI.renderCrafting(
        this.inventory,
        this.player,
        ITEM_ICONS,
        this.worldItems,
      );
  }

  /**
   * Render the player's hotbar slots.
   *
   * @returns {void}
   */
  renderHotbar() {
    this.inventoryUI.renderHotbar(
      this.inventory,
      this.player,
      this.fireballCooldown,
      ITEM_ICONS,
      getItemCooldown,
    );
  }

  /**
   * Show or hide the inventory UI.
   *
   * @param {boolean} open - Whether the inventory should be visible.
   * @returns {void}
   */
  toggleInventory(open) {
    if (open === this.inventoryOpen) return;
    this.inventoryOpen = open;
    this.inventoryUI.toggleInventory(open);
    if (this.inventoryOpen) {
      this.renderInventory();
    }
  }

  /**
   * Show or hide the crafting menu UI.
   *
   * @param {boolean} open - Whether the crafting menu should be visible.
   * @returns {void}
   */
  toggleCrafting(open) {
    if (open === this.craftingOpen) return;
    this.craftingOpen = open;
    this.craftingUI.toggleCrafting(
      open,
      this.inventory,
      this.player,
      ITEM_ICONS,
      this.worldItems,
    );
  }

  /**
   * Render the skill tree UI based on the player's current skills.
   *
   * @returns {void}
   */
  renderSkillTree() {
    this.skillTreeUI.renderSkillTree(this.player, SKILL_INFO);
  }

  /**
   * Refresh the details panel within the skill tree UI.
   *
   * @returns {void}
   */
  updateSkillDetails() {
    this.skillTreeUI.updateSkillDetails(this.player);
  }

  /**
   * Show or hide the skill tree UI overlay.
   *
   * @param {boolean} open - Whether the skill tree should be visible.
   * @returns {void}
   */
  toggleSkillTree(open) {
    if (open === this.skillTreeOpen) return;
    this.skillTreeOpen = open;
    this.skillTreeUI.toggleSkillTree(open, this.player, SKILL_INFO);
  }

  /**
   * Advance the game simulation by one frame.
   *
   * Handles player actions, ability updates, collisions and win/loss logic.
   * @returns {void}
   */
  update() {
    if (this.gameOver || this.victory) return;
    updateWalls(this.walls);
    if (this.player.phoenixCooldown > 0) this.player.phoenixCooldown--;
    if (this.player.damageBuffTimer > 0) {
      this.player.damageBuffTimer--;
      if (this.player.damageBuffTimer <= 0) this.player.damageBuffMult = 1;
    }

    if (this.player.health <= 0) {
      if (!tryPhoenixRevival(this.player, PLAYER_MAX_HEALTH, this.zombies)) {
        this.gameOver = true;
        this.gameOverDiv.style.display = "block";
        return;
      }
    }

    const activeSlot = getActiveHotbarItem(this.inventory);
    if (activeSlot) {
      const item = activeSlot.item;
      if (item === "bow") {
        this.player.weapon = { type: "bow" };
      } else if (
        ["baseball_bat", "hammer", "crowbar", "axe", "reinforced_axe"].includes(
          item,
        )
      ) {
        const dmgMap = {
          hammer: 2,
          crowbar: 3,
          axe: 4,
          reinforced_axe: 6,
          baseball_bat: 2,
        };
        this.player.weapon = { type: item, damage: dmgMap[item] || 1 };
      } else {
        this.player.weapon = null;
      }
    } else {
      this.player.weapon = null;
    }

    const useHeld = this.keys[" "] || this.keys.mouse;
    const useTrigger = useHeld && !this.prevUse;
    this.prevUse = useHeld;
    const aimHeld = this.keys[" "] || this.keys.mouse2;
    const aimRelease = !aimHeld && this.prevAim;
    this.prevAim = aimHeld;

    const prevX = this.player.x;
    const prevY = this.player.y;

    let moveX = 0;
    let moveY = 0;
    if (this.keys["arrowup"] || this.keys["w"]) moveY -= this.player.speed;
    if (this.keys["arrowdown"] || this.keys["s"]) moveY += this.player.speed;
    if (this.keys["arrowleft"] || this.keys["a"]) moveX -= this.player.speed;
    if (this.keys["arrowright"] || this.keys["d"]) moveX += this.player.speed;

    const toMouseX = this.mousePos.x - this.player.x;
    const toMouseY = this.mousePos.y - this.player.y;
    const len = Math.hypot(toMouseX, toMouseY);
    const facingX = len > 0 ? toMouseX / len : this.player.facing.x;
    const facingY = len > 0 ? toMouseY / len : this.player.facing.y;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "input",
          action: "move",
          moveX,
          moveY,
          facingX,
          facingY,
        }),
      );
    }

    // this.player.x += moveX;
    // this.player.y += moveY;
    // if (len > 0) {
    //   this.player.facing.x = facingX;
    //   this.player.facing.y = facingY;
    // }

    if (this.player.damageCooldown > 0) this.player.damageCooldown--;

    /*
    this.player.x = Math.max(
      10,
      Math.min(this.canvas.width - 10, this.player.x),
    );
    this.player.y = Math.max(
      10,
      Math.min(this.canvas.height - 10, this.player.y),
    );

    if (this.walls.some((w) => circleRectColliding(this.player, w, 10))) {
      this.player.x = prevX;
      this.player.y = prevY;
    }
    */

    if (this.weapon && isColliding(this.player, this.weapon, 10)) {
      addItem(this.inventory, this.weapon.type, 1);
      const idx = this.inventory.slots.findIndex(
        (s) => s.item === this.weapon.type,
      );
      if (idx !== -1) moveToHotbar(this.inventory, idx, 0);
      this.weapon = null;
      this.renderInventory();
      this.renderHotbar();
    }

    if (!this.looting && this.keys["f"]) {
      const cont = this.containers.find(
        (c) =>
          Math.hypot(c.x - this.player.x, c.y - this.player.y) <=
            this.LOOT_DIST &&
          (!c.opened || c.item),
      );
      const shelf = this.walls.find((w) => {
        const cx = Math.max(w.x, Math.min(this.player.x, w.x + SEGMENT_SIZE));
        const cy = Math.max(w.y, Math.min(this.player.y, w.y + SEGMENT_SIZE));
        const wx = cx - this.player.x;
        const wy = cy - this.player.y;
        const dist = Math.hypot(wx, wy);
        const facingDot = wx * this.player.facing.x + wy * this.player.facing.y;
        return dist <= this.LOOT_DIST && facingDot > 0 && (!w.opened || w.item);
      });
      const target = cont || shelf;
      if (target) {
        this.looting = target;
        this.lootTimer = this.LOOT_TIME;
        this.lootFill.style.width = "0%";
        this.lootDiv.style.display = "block";
      }
    }

    if (this.looting) {
      let dist, facingDot;
      if ("size" in this.looting) {
        const cx = Math.max(
          this.looting.x,
          Math.min(this.player.x, this.looting.x + SEGMENT_SIZE),
        );
        const cy = Math.max(
          this.looting.y,
          Math.min(this.player.y, this.looting.y + SEGMENT_SIZE),
        );
        const wx = cx - this.player.x;
        const wy = cy - this.player.y;
        dist = Math.hypot(wx, wy);
        facingDot = wx * this.player.facing.x + wy * this.player.facing.y;
      } else {
        const wx = this.looting.x - this.player.x;
        const wy = this.looting.y - this.player.y;
        dist = Math.hypot(wx, wy);
        facingDot = wx * this.player.facing.x + wy * this.player.facing.y;
      }
      if (dist > this.LOOT_DIST || facingDot <= 0 || !this.keys["f"]) {
        this.looting = null;
        this.lootDiv.style.display = "none";
      } else {
        this.lootTimer--;
        this.lootFill.style.width = `${((this.LOOT_TIME - this.lootTimer) / this.LOOT_TIME) * 100}%`;
        if (this.lootTimer <= 0) {
          if (!this.looting.opened) {
            if ("size" in this.looting) {
              openShelf(this.looting, CRAFTING_MATERIALS);
            } else {
              openContainer(this.looting);
            }
          }
          if (this.looting.item) {
            if (addItem(this.inventory, this.looting.item, 1)) {
              this.hud.showPickupMessage(`Picked up ${this.looting.item}`);
              this.looting.item = null;
              this.renderInventory();
              this.renderHotbar();
            } else {
              this.hud.showPickupMessage("Inventory Full");
            }
          } else {
            this.hud.showPickupMessage("Nothing found");
          }
          this.looting = null;
          this.lootDiv.style.display = "none";
        }
      }
    }

    if (this.player.swingTimer > 0) this.player.swingTimer--;

    if (this.player.weapon && useHeld && this.player.swingTimer <= 0) {
      const killed = attackZombiesWithKills(
        this.player,
        this.zombies,
        this.player.weapon.damage * this.player.damageBuffMult,
        30,
        this.player.facing,
        Math.PI / 2,
        5,
      );
      const dir = { x: this.player.facing.x, y: this.player.facing.y };
      this.walls.forEach((w) => {
        if (wallSwingHit(this.player, w, 30, dir, Math.PI / 2)) {
          const allowed =
            {
              hammer: ["plastic"],
              crowbar: ["plastic", "wood"],
              axe: ["plastic", "wood", "steel"],
              reinforced_axe: ["plastic", "wood", "steel"],
              baseball_bat: ["plastic", "wood", "steel"],
            }[this.player.weapon.type] || [];
          if (allowed.includes(w.material)) {
            const destroyed = damageWall(
              w,
              this.player.weapon.damage * this.player.damageBuffMult,
            );
            if (destroyed) {
              this.worldItems.push({
                x: w.x + SEGMENT_SIZE / 2,
                y: w.y + SEGMENT_SIZE / 2,
                type: this.MATERIAL_DROPS[w.material],
                count: 1,
              });
            }
          }
        }
      });
      killed.forEach((z) => dropLoot(z, this.worldItems));
      this.player.swingTimer = 10;
    }

    if (useTrigger && activeSlot && CONSUMABLE_ITEMS.has(activeSlot.item)) {
      const used = consumeHotbarItem(this.inventory, this.inventory.active);
      if (used) {
        applyConsumableEffect(this.player, used);
        this.hud.showPickupMessage(`Used ${used}`);
        this.renderInventory();
        this.renderHotbar();
      }
    }

    updateZombies(
      this.zombies,
      this.player,
      this.walls,
      this.canvas.width,
      this.canvas.height,
    );
    if (this.player.health <= 0) {
      if (!tryPhoenixRevival(this.player, PLAYER_MAX_HEALTH, this.zombies)) {
        this.gameOver = true;
        this.gameOverDiv.style.display = "block";
        this.hud.hideWaveCounter();
      }
    }

    const abilityState = updateAbilities({
      player: this.player,
      inventory: this.inventory,
      fireballs: this.fireballs,
      fireOrbs: this.fireOrbs,
      arrows: this.arrows,
      zombies: this.zombies,
      mousePos: this.mousePos,
      worldItems: this.worldItems,
      hud: this.hud,
      renderInventory: () => this.renderInventory(),
      renderHotbar: () => this.renderHotbar(),
      useHeld,
      aimHeld,
      aimRelease,
      fireballCooldown: { value: this.fireballCooldown },
    });
    this.bowAiming = abilityState.bowAiming;

    checkAllCollisions({
      player: this.player,
      zombies: this.zombies,
      arrows: this.arrows,
      fireballs: this.fireballs,
      walls: this.walls,
      explosions: this.explosions,
      worldItems: this.worldItems,
      inventory: this.inventory,
      hud: this.hud,
      renderInventory: () => this.renderInventory(),
      renderHotbar: () => this.renderHotbar(),
      dropLoot,
      materialDrops: this.MATERIAL_DROPS,
    });
    this.fireballCooldown = abilityState.fireballCooldown;
    this.hud.update();

    if (!this.victory && this.zombies.length === 0) {
      this.victory = true;
      this.victoryDiv.style.display = "block";
      this.hud.hideWaveCounter();
    }
    if (this.skillTreeOpen) this.renderSkillTree();
    this.renderHotbar();
  }

  /**
   * Draw the current world state to the canvas.
   *
   * @returns {void}
   */
  render() {
    renderScene(this.ctx, {
      walls: this.walls,
      containers: this.containers,
      spawnDoor: this.spawnDoor,
      player: this.player,
      playerSprite: this.playerSprite,
      fireZombieSprite: this.fireZombieSprite,
      zombieSprite: this.zombieSprite,
      fireOrbs: this.fireOrbs,
      hud: this.hud,
      inventory: this.inventory,
      ITEM_IMAGES: this.ITEM_IMAGES,
      weapon: this.weapon,
      worldItems: this.worldItems,
      arrows: this.arrows,
      mousePos: this.mousePos,
      zombies: this.zombies,
      activeSlot: getActiveHotbarItem(this.inventory),
      fireballs: this.fireballs,
      explosions: this.explosions,
      bowAiming: this.bowAiming,
      cardboardBoxImg: this.cardboardBoxImg,
      countItem: () => {},
    });
  }
}
