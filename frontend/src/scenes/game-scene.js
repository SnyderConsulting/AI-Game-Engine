/**
 * Minimal client scene that renders the authoritative state from the server.
 */
import { createHUD } from "../components/hud.js";

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
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.skillTreeOpen = false;
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
  }

  /**
   * Adjust the canvas to the server defined dimensions.
   * @returns {void}
   */
  resizeCanvas() {
    this.canvas.width = this.state.width;
    this.canvas.height = this.state.height;
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
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "gray";
    this.state.walls.forEach((w) => {
      ctx.fillRect(w.x, w.y, w.size, w.size);
    });
    ctx.fillStyle = "green";
    Object.entries(this.state.players).forEach(([id, p]) => {
      ctx.fillStyle = id === this.playerId ? "blue" : "green";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "red";
    this.state.zombies.forEach((z) => {
      ctx.beginPath();
      ctx.arc(z.x, z.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    const player = this.state.players[this.playerId];
    if (player) {
      this.hud.render(ctx, player, { slots: [], hotbar: [] }, () => 0);
    }
  }

  togglePanel(div, flag) {
    this[flag] = !this[flag];
    div.style.display = this[flag] ? "block" : "none";
  }

  toggleInventory() {
    this.togglePanel(this.inventoryDiv, "inventoryOpen");
  }

  toggleCrafting() {
    this.togglePanel(this.craftingDiv, "craftingOpen");
  }

  toggleSkillTree() {
    this.togglePanel(this.skillTreeDiv, "skillTreeOpen");
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
