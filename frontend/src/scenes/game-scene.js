/**
 * Minimal client scene that renders the authoritative state from the server.
 */

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
  }

  /**
   * Handle key down events.
   * @param {KeyboardEvent} e - Event data.
   * @returns {void}
   */
  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
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
