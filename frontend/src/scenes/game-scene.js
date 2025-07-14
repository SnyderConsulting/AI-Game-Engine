/**
 * Minimal client scene that renders the authoritative state from the server.
 */
import { createHUD } from "../components/hud.js";
import { ITEM_ICONS } from "../items.js";
import { loadImages } from "../utils/assets.js";
import { WALL_IMAGES } from "../entities/walls.js";
import { createInventoryUI } from "../components/inventory-ui.js";
import { createCraftingUI } from "../components/crafting-ui.js";
import { createSkillTreeUI } from "../components/skill-tree-ui.js";
import { makeDraggable } from "../ui.js";
import {
  createInventory,
  addItem,
  removeItem,
  countItem,
} from "../systems/inventory-system.js";
import { SKILL_INFO } from "../systems/skill-tree-system.js";

export const LOOT_TICKS = 180;

/**
 * Compute the distance from a point to the edge of a wall.
 * @param {number} px - X position.
 * @param {number} py - Y position.
 * @param {object} wall - Wall data with x, y and size.
 * @returns {number} Distance in pixels.
 */
function distanceToWall(px, py, wall) {
  const cx = Math.max(wall.x, Math.min(px, wall.x + wall.size));
  const cy = Math.max(wall.y, Math.min(py, wall.y + wall.size));
  return Math.hypot(px - cx, py - cy);
}

export class GameScene {
  /**
   * Construct a new scene and set up default state.
   */
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    /** @type {WebSocket|null} */
    this.ws = null;
    /** @type {string|null} */
    this.playerId = null;

    this.state = {
      players: {},
      zombies: [],
      walls: [],
      width: 800,
      height: 600,
    };

    this.keys = {};

    this.inventoryDiv = document.getElementById("inventory");
    this.craftingDiv = document.getElementById("craftingMenu");
    this.skillTreeDiv = document.getElementById("skillTree");
    this.gameOverDiv = document.getElementById("gameOver");
    this.newGameBtn = document.getElementById("newGameBtn");
    this.newGameBtn?.addEventListener("click", () => window.location.reload());
    this.hud = createHUD({
      pickupMsg: document.getElementById("pickupMessage"),
      waveCounterDiv: document.getElementById("waveCounter"),
    });
    this.itemImages = loadImages(ITEM_ICONS);
    this.playerSprite = loadImages({
      player: "assets/sprite_player.png",
    }).player;
    this.zombieSprite = loadImages({ z: "assets/sprite_zombie.png" }).z;
    this.fireZombieSprite = loadImages({
      f: "assets/sprite_fire_zombie.png",
    }).f;
    this.cardboardBoxImg = loadImages({ box: "assets/cardboard_box.png" }).box;

    this.inventory = createInventory();

    this.inventoryPos = { left: null, top: null };
    this.inventoryUI = createInventoryUI({
      inventoryDiv: this.inventoryDiv,
      inventoryGrid: document.getElementById("inventoryGrid"),
      hotbarDiv: document.getElementById("hotbar"),
      inventoryBar: document.getElementById("inventoryBar"),
      inventoryClose: document.getElementById("inventoryClose"),
      inventoryPos: this.inventoryPos,
    });

    this.craftingPos = { left: null, top: null };
    this.craftingUI = createCraftingUI(
      {
        craftingDiv: this.craftingDiv,
        craftingList: document.getElementById("craftingList"),
        craftingBar: document.getElementById("craftingBar"),
        craftingClose: document.getElementById("craftingClose"),
        craftingPos: this.craftingPos,
      },
      {
        renderInventory: () =>
          this.inventoryUI.renderInventory(
            this.inventory,
            this.state.players[this.playerId] || {},
            {},
            this.itemImages,
            () => ({ remaining: 0, max: 0 }),
          ),
        renderHotbar: () =>
          this.inventoryUI.renderHotbar(
            this.inventory,
            this.state.players[this.playerId] || {},
            {},
            this.itemImages,
            () => ({ remaining: 0, max: 0 }),
          ),
      },
    );

    this.skillTreePos = { left: null, top: null };
    this.skillTreeUI = createSkillTreeUI(
      {
        skillTreeDiv: this.skillTreeDiv,
        skillTreeBar: document.getElementById("skillTreeBar"),
        skillTreeClose: document.getElementById("skillTreeClose"),
        skillPointsDiv: document.getElementById("skillPoints"),
        skillGrid: document.getElementById("skillGrid"),
        skillDetails: document.getElementById("skillDetails"),
        skillNameDiv: document.getElementById("skillName"),
        skillDescDiv: document.getElementById("skillDesc"),
        skillLevelsDiv: document.getElementById("skillLevels"),
        skillLevelDiv: document.getElementById("skillLevel"),
        skillCostDiv: document.getElementById("skillCost"),
        skillUpgradeBtn: document.getElementById("skillUpgrade"),
        skillTreePos: this.skillTreePos,
      },
      this.itemImages,
    );

    makeDraggable(
      this.inventoryDiv,
      document.getElementById("inventoryBar"),
      document.getElementById("inventoryClose"),
      this.inventoryPos,
      this.inventoryUI.toggleInventory,
    );
    makeDraggable(
      this.craftingDiv,
      document.getElementById("craftingBar"),
      document.getElementById("craftingClose"),
      this.craftingPos,
      (open) =>
        this.craftingUI.toggleCrafting(
          open,
          this.inventory,
          this.state.players[this.playerId] || {},
          this.itemImages,
          [],
        ),
    );
    makeDraggable(
      this.skillTreeDiv,
      document.getElementById("skillTreeBar"),
      document.getElementById("skillTreeClose"),
      this.skillTreePos,
      (open) =>
        this.skillTreeUI.toggleSkillTree(
          open,
          this.state.players[this.playerId] || {},
          SKILL_INFO,
        ),
    );

    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.skillTreeOpen = false;

    this.scale = 1;
    this.camera = { x: 0, y: 0, width: 0, height: 0 };

    this.mousePos = { x: 0, y: 0 };

    this.lootProgress = document.getElementById("lootProgress");
    this.lootFill = document.getElementById("lootFill");
    this.isLooting = false;
  }

  /**
   * Synchronize the local inventory with authoritative counts from the server.
   *
   * @param {Record<string, number>} serverInv - Mapping of item ids to counts.
   * @returns {void}
   */
  syncInventory(serverInv) {
    const all = new Set([
      ...Object.keys(serverInv),
      ...this.inventory.slots.filter((s) => s.item).map((s) => s.item),
      ...this.inventory.hotbar.filter((s) => s.item).map((s) => s.item),
    ]);
    for (const id of all) {
      const target = serverInv[id] || 0;
      const current = countItem(this.inventory, id);
      if (current < target) addItem(this.inventory, id, target - current);
      else if (current > target)
        removeItem(this.inventory, id, current - target);
    }
  }

  /**
   * Establish a WebSocket connection to the backend.
   *
   * @param {string} url - WebSocket endpoint.
   * @returns {void}
   */
  initWebSocket(url) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener("message", (e) =>
      this.handleServerMessage(e.data),
    );
  }

  /**
   * Parse a message from the server and update local state.
   *
   * @param {string} data - JSON encoded server state.
   * @returns {void}
   */
  handleServerMessage(data) {
    const msg = JSON.parse(data);
    if (msg.type === "welcome") {
      this.playerId = msg.playerId;
      return;
    }
    const oldContainers = this.state.containers || [];
    const oldWalls = this.state.walls || [];
    this.state = msg;
    // Show loot results for newly opened containers
    msg.containers?.forEach((c) => {
      const prev = oldContainers.find((p) => p.id === c.id);
      if (c.opened && (!prev || !prev.opened)) {
        this.hud.showPickupMessage(
          c.item ? `You found ${c.item}` : "Container is empty",
        );
      }
    });
    // Show loot results for shelves
    msg.walls?.forEach((w, i) => {
      const prev = oldWalls[i];
      if (w.opened && (!prev || !prev.opened)) {
        this.hud.showPickupMessage(
          w.item ? `You found ${w.item}` : "Nothing here",
        );
      }
    });
    const player = msg.players[this.playerId];
    if (player) this.syncInventory(player.inventory || {});
    const remaining = msg.loot_progress?.[this.playerId];
    if (typeof remaining === "number") {
      this.isLooting = true;
      const pct = (LOOT_TICKS - remaining) / LOOT_TICKS;
      this.lootFill.style.width = `${Math.min(1, pct) * 100}%`;
      this.lootProgress.style.display = "block";
    } else if (this.isLooting) {
      this.isLooting = false;
      this.lootFill.style.width = "0%";
      this.lootProgress.style.display = "none";
    }
    this.resizeCanvas();
    const curPlayer = this.state.players[this.playerId];
    if (this.inventoryOpen) {
      this.inventoryUI.renderInventory(
        this.inventory,
        curPlayer || {},
        {},
        this.itemImages,
        () => ({ remaining: 0, max: 0 }),
      );
    }
    this.inventoryUI.renderHotbar(
      this.inventory,
      curPlayer || {},
      {},
      this.itemImages,
      () => ({ remaining: 0, max: 0 }),
    );
  }

  /**
   * Adjust the canvas to the server defined dimensions.
   * @returns {void}
   */
  resizeCanvas() {
    const displayW = window.innerWidth;
    const displayH = window.innerHeight;
    this.canvas.width = displayW;
    this.canvas.height = displayH;
    const scaleByHeight = displayH / this.state.height;
    this.scale = Math.min(1, scaleByHeight);
    this.camera.width = displayW / this.scale;
    this.camera.height = displayH / this.scale;
  }

  /**
   * Process keyboard input and send to the server.
   * @returns {void}
   */
  update() {
    this.hud.update();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const moveX =
      (this.keys["d"] || this.keys["arrowright"] ? 1 : 0) -
      (this.keys["a"] || this.keys["arrowleft"] ? 1 : 0);
    const moveY =
      (this.keys["s"] || this.keys["arrowdown"] ? 1 : 0) -
      (this.keys["w"] || this.keys["arrowup"] ? 1 : 0);
    const player = this.state.players[this.playerId];
    if (!player) return;
    const dirX = this.mousePos.x - player.x;
    const dirY = this.mousePos.y - player.y;
    const len = Math.hypot(dirX, dirY) || 1;
    const facingX = dirX / len;
    const facingY = dirY / len;
    this.ws.send(
      JSON.stringify({
        action: "move",
        moveX,
        moveY,
        facingX,
        facingY,
      }),
    );
  }

  /**
   * Draw the latest game state to the canvas.
   * @returns {void}
   */
  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.updateCamera();
    ctx.translate(-this.camera.x, -this.camera.y);
    this.state.walls.forEach((w) => {
      const img = WALL_IMAGES[w.material];
      ctx.globalAlpha = w.opened ? 0.5 : 1;
      if (img && img.complete) {
        ctx.drawImage(img, w.x, w.y, w.size, w.size);
      } else {
        ctx.fillStyle = "gray";
        ctx.fillRect(w.x, w.y, w.size, w.size);
      }
      ctx.globalAlpha = 1;
    });
    if (this.state.door) {
      ctx.fillStyle = "brown";
      ctx.fillRect(this.state.door.x - 10, this.state.door.y - 10, 20, 20);
    }
    Object.entries(this.state.players).forEach(([id, p]) => {
      const img = this.playerSprite;
      let facingX = p.facing_x;
      let facingY = p.facing_y;
      if (id === this.playerId) {
        const dx = this.mousePos.x - p.x;
        const dy = this.mousePos.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        facingX = dx / d;
        facingY = dy / d;
      }
      const angle = Math.atan2(facingY, facingX) - Math.PI / 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.drawImage(img, -16, -16, 32, 32);
      ctx.restore();
    });
    this.state.zombies.forEach((z) => {
      const img =
        z.variant === "fire" ? this.fireZombieSprite : this.zombieSprite;
      const angle = Math.atan2(z.facing_y, z.facing_x) - Math.PI / 2;
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(angle);
      ctx.drawImage(img, -16, -16, 32, 32);
      ctx.restore();
    });
    this.state.containers?.forEach((c) => {
      ctx.globalAlpha = c.opened ? 0.5 : 1;
      ctx.drawImage(this.cardboardBoxImg, c.x - 10, c.y - 10, 20, 20);
      ctx.globalAlpha = 1;
    });
    const player = this.state.players[this.playerId];
    if (player) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.hud.render(ctx, player, { slots: [], hotbar: [] }, () => 0);
      if (player.health <= 0) {
        this.gameOverDiv.style.display = "block";
      } else {
        this.gameOverDiv.style.display = "none";
      }
    } else {
      this.gameOverDiv.style.display = "none";
    }
  }

  togglePanel(div, flag) {
    this[flag] = !this[flag];
    div.style.display = this[flag] ? "block" : "none";
  }

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    this.inventoryUI.toggleInventory(this.inventoryOpen);
    if (this.inventoryOpen) {
      const player = this.state.players[this.playerId] || {};
      this.inventoryUI.renderInventory(
        this.inventory,
        player,
        {},
        this.itemImages,
        () => ({ remaining: 0, max: 0 }),
      );
      this.inventoryUI.renderHotbar(
        this.inventory,
        player,
        {},
        this.itemImages,
        () => ({ remaining: 0, max: 0 }),
      );
    }
  }

  toggleCrafting() {
    this.craftingOpen = !this.craftingOpen;
    this.craftingUI.toggleCrafting(
      this.craftingOpen,
      this.inventory,
      this.state.players[this.playerId] || {},
      this.itemImages,
      [],
    );
  }

  toggleSkillTree() {
    this.skillTreeOpen = !this.skillTreeOpen;
    this.skillTreeUI.toggleSkillTree(
      this.skillTreeOpen,
      this.state.players[this.playerId] || {},
      SKILL_INFO,
    );
  }

  /**
   * Update the stored mouse position converting from screen to world coords.
   *
   * @param {number} clientX - Mouse X coordinate on the page.
   * @param {number} clientY - Mouse Y coordinate on the page.
   * @returns {void}
   */
  setMousePos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / this.scale + this.camera.x;
    const y = (clientY - rect.top) / this.scale + this.camera.y;
    this.mousePos.x = x;
    this.mousePos.y = y;
  }

  /**
   * Update the camera position to center on the active player.
   * @returns {void}
   */
  updateCamera() {
    const p = this.state.players[this.playerId];
    if (!p) return;
    const halfW = this.camera.width / 2;
    const halfH = this.camera.height / 2;
    let cx = p.x - halfW;
    let cy = p.y - halfH;
    cx = Math.max(0, Math.min(cx, this.state.width - this.camera.width));
    cy = Math.max(0, Math.min(cy, this.state.height - this.camera.height));
    this.camera.x = cx;
    this.camera.y = cy;
  }

  /**
   * Handle key down events for movement and actions.
   *
   * Recognized controls:
   * - **WASD** or **Arrow Keys** for movement
   * - **F** or **Page Down** to loot
   * - **Tab** to attack
   * - **I/E** to open inventory
   * - **C** to open crafting
   * - **K** to open the skill tree
   *
   * @param {KeyboardEvent} e - Event data.
   * @returns {void}
   */
  handleKeyDown(e) {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === "i" || k === "e") this.toggleInventory();
    else if (k === "c") this.toggleCrafting();
    else if (k === "k") this.toggleSkillTree();
    else if (k === "tab") {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: "attack" }));
      }
    } else if ((k === "f" || k === "pagedown") && !this.isLooting) {
      const player = this.state.players[this.playerId];
      if (player && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const target = this.state.containers?.find(
          (c) => !c.opened && Math.hypot(c.x - player.x, c.y - player.y) < 20,
        );
        let msg = null;
        if (target) {
          msg = { action: "start_looting", containerId: target.id };
        } else {
          const shelf = this.state.walls.find(
            (w) => !w.opened && distanceToWall(player.x, player.y, w) < 20,
          );
          if (shelf) msg = { action: "start_looting" };
        }
        if (msg) {
          this.ws.send(JSON.stringify(msg));
        }
      }
    }
  }

  /**
   * Handle key up events.
   *
   * Releasing **F** or **Page Down** cancels looting.
   * All other keys simply update the internal state map.
   *
   * @param {KeyboardEvent} e - Event data.
   * @returns {void}
   */
  handleKeyUp(e) {
    const k = e.key.toLowerCase();
    this.keys[k] = false;
    if (
      (k === "f" || k === "pagedown") &&
      this.ws &&
      this.ws.readyState === WebSocket.OPEN
    ) {
      this.ws.send(JSON.stringify({ action: "cancel_looting" }));
    }
  }
}
