/**
 * Minimal client scene that renders the authoritative state from the server.
 */
import { createHUD } from "../components/hud.js";
import { ITEM_ICONS } from "../items.js";
import { loadImages } from "../utils/assets.js";
import { WALL_IMAGES } from "../entities/walls.js";
import { createInventoryUI } from "../components/inventory-ui.js";

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
    this.inventoryUI = createInventoryUI({
      inventoryDiv: this.inventoryDiv,
      inventoryGrid: document.getElementById("inventoryGrid"),
      hotbarDiv: document.getElementById("hotbar"),
      inventoryBar: document.getElementById("inventoryBar"),
      inventoryClose: document.getElementById("inventoryClose"),
      inventoryPos: { left: null, top: null },
    });
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.skillTreeOpen = false;

    this.scale = 1;
    this.camera = { x: 0, y: 0, width: 0, height: 0 };
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
    this.state = msg;
    this.resizeCanvas();
    const player = this.state.players[this.playerId];
    if (player && player.inventory && this.inventoryOpen) {
      this.inventoryUI.renderInventory(
        player.inventory,
        player,
        {},
        this.itemImages,
        () => ({ remaining: 0, max: 0 }),
      );
      this.inventoryUI.renderHotbar(
        player.inventory,
        player,
        {},
        this.itemImages,
        () => ({ remaining: 0, max: 0 }),
      );
    }
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
    this.scale = displayH / this.state.height;
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
    const moveX = (this.keys["d"] ? 1 : 0) - (this.keys["a"] ? 1 : 0);
    const moveY = (this.keys["s"] ? 1 : 0) - (this.keys["w"] ? 1 : 0);
    if (moveX || moveY) {
      this.ws.send(
        JSON.stringify({
          action: "move",
          moveX,
          moveY,
          facingX: moveX,
          facingY: moveY,
        }),
      );
    }
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
      if (img && img.complete) {
        ctx.drawImage(img, w.x, w.y, w.size, w.size);
      } else {
        ctx.fillStyle = "gray";
        ctx.fillRect(w.x, w.y, w.size, w.size);
      }
    });
    Object.entries(this.state.players).forEach(([id, p]) => {
      const img = this.playerSprite;
      const angle = Math.atan2(p.facing_y, p.facing_x) - Math.PI / 2;
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
      ctx.drawImage(this.cardboardBoxImg, c.x - 10, c.y - 10, 20, 20);
    });
    const player = this.state.players[this.playerId];
    if (player) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.hud.render(ctx, player, { slots: [], hotbar: [] }, () => 0);
    }
  }

  togglePanel(div, flag) {
    this[flag] = !this[flag];
    div.style.display = this[flag] ? "block" : "none";
  }

  toggleInventory() {
    const player = this.state.players[this.playerId];
    if (player && player.inventory) {
      this.inventoryOpen = !this.inventoryOpen;
      this.inventoryUI.toggleInventory(this.inventoryOpen);
      if (this.inventoryOpen) {
        this.inventoryUI.renderInventory(
          player.inventory,
          player,
          {},
          this.itemImages,
          () => ({ remaining: 0, max: 0 }),
        );
        this.inventoryUI.renderHotbar(
          player.inventory,
          player,
          {},
          this.itemImages,
          () => ({ remaining: 0, max: 0 }),
        );
      }
    } else {
      this.togglePanel(this.inventoryDiv, "inventoryOpen");
    }
  }

  toggleCrafting() {
    this.togglePanel(this.craftingDiv, "craftingOpen");
  }

  toggleSkillTree() {
    this.togglePanel(this.skillTreeDiv, "skillTreeOpen");
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
   * Handle key down events.
   * @param {KeyboardEvent} e - Event data.
   * @returns {void}
   */
  handleKeyDown(e) {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === "i" || k === "e") this.toggleInventory();
    else if (k === "c") this.toggleCrafting();
    else if (k === "k") this.toggleSkillTree();
    else if (k === "f") {
      const player = this.state.players[this.playerId];
      if (player) {
        const target = this.state.containers?.find(
          (c) => !c.opened && Math.hypot(c.x - player.x, c.y - player.y) < 20,
        );
        if (target && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({ action: "loot", containerId: target.id }),
          );
        }
      }
    }
  }

  /**
   * Handle key up events.
   * @param {KeyboardEvent} e - Event data.
   * @returns {void}
   */
  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }
}
