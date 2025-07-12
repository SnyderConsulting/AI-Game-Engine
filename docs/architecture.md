# Architecture Overview

This project is split into separate frontend and backend components.

- **Frontend**: HTML5/JavaScript client rendered on a `<canvas>` element using a lightweight setup with Vite. Game logic is kept independent from rendering to encourage modularity. Source files under `frontend/src/` are organized into `components/`, `entities/`, `scenes/`, `systems/` and `utils/` directories. Common game objects like the player, arrows and floating orbs live in the `entities` folder.
  Zombie behavior resides in `frontend/src/entities/zombie.js` to keep AI code modular.
  Reusable math helpers like `moveTowards` and `isColliding` live in `frontend/src/utils/geometry.js`.
  UI elements such as the inventory, skill tree and HUD are implemented in separate modules under `frontend/src/components/`.
  Inventory and hotbar slots support drag-and-drop to swap or move items using the
  same logic as clicking. Drag handlers set the `dropEffect` to `move` and
  handle the `dragenter` event so the cursor reliably shows that the slots
  accept drops.
  Game systems such as rendering, abilities and collisions reside in `frontend/src/systems/` to keep the main loop minimal. The collision system manages all projectile interactions as well as player contacts with zombies and world items.
- **Backend**: Python FastAPI service providing API endpoints. It now exposes a
  WebSocket endpoint at `/ws/game/{game_id}` and includes a `GameManager`
  capable of creating multiple `GameSession` objects. Each session tracks its
  own players and connections. When a client connects the session assigns it a
  UUID and immediately sends a "welcome" message containing this ID. A new game
  can be created via the `http://${hostname}:8000/api/games` HTTP endpoint. The
  service began with a simple health check but is structured for future
  realtime features. During development the backend enables CORS for
  `http://localhost:3000` so the Vite server can call the API. The Clients first see a lobby screen that can create or
  join a session using the same `http://${hostname}:8000/api/games` endpoint.
  The lobby passes the chosen `gameId` to a
  `startGame(gameId)` function which constructs a `GameScene`, attaches keyboard
  event listeners, and connects to a WebSocket at
  `ws://${hostname}:8000/ws/game/${gameId}`. Once connected the lobby hides and
  the start menu overlay is removed so the game canvas becomes active. The scene forwards player input messages over
  the socket such as `moveX` and `moveY` deltas. The server interprets these
  values using the `GameManager` to update each player's authoritative state.
  Facing is kept as normalized `facing_x` and `facing_y` numbers so the player
  can point in any direction.
  A background task started on application startup runs a server game loop that
  updates the world simulation including AI movement and then broadcasts the
  complete game state to all connected clients roughly 60 times per second.

All map generation and AI logic now live exclusively on the backend. When a game
session is created the server generates the walls, spawn door and initial
zombies exactly once. Clients merely render this shared state and relay player
input.

Both sides communicate via HTTP or WebSockets. The repository emphasizes clear separation of concerns and maintainable code.
The gameplay state is managed by a `GameScene` class in `frontend/src/scenes/game-scene.js`. It owns the player, zombies and other world objects and exposes `update` and `render` methods used by `main.js`.
