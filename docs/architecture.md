# Architecture Overview

This project is split into separate frontend and backend components.

- **Frontend**: HTML5/JavaScript client rendered on a `<canvas>` element using a lightweight setup with Vite. Game logic is kept independent from rendering to encourage modularity. Source files under `frontend/src/` are organized into `components/`, `entities/`, `scenes/`, `systems/` and `utils/` directories. Common game objects like the player, arrows and floating orbs live in the `entities` folder.
  Zombie behavior resides in `frontend/src/entities/zombie.js` to keep AI code modular.
  Reusable math helpers like `moveTowards` and `isColliding` live in `frontend/src/utils/geometry.js`.
  UI elements such as the inventory, skill tree and HUD are implemented in separate modules under `frontend/src/components/`.
  Game systems such as rendering, abilities and collisions reside in `frontend/src/systems/` to keep the main loop minimal. The collision system manages all projectile interactions as well as player contacts with zombies and world items.
- **Backend**: Python FastAPI service providing API endpoints. It now exposes a
  WebSocket endpoint at `/ws/game` and includes a lightweight `GameManager`
  responsible for tracking connected players. The service began with a simple
  health check but is structured for future realtime features. The
  **frontend** connects to this WebSocket when a `GameScene` is created and
  forwards player input messages over the socket. Input includes `moveX` and
  `moveY` deltas along with the mouse facing vector. The server interprets these
  values using the `GameManager` to update each player's authoritative state.
  Facing is kept as normalized `facing_x` and `facing_y` numbers so the player
  can point in any direction.
  A background task started on application startup runs a server game loop that
  broadcasts the complete game state to all connected clients roughly 60 times
  per second.

Both sides communicate via HTTP or WebSockets. The repository emphasizes clear separation of concerns and maintainable code.
The gameplay state is managed by a `GameScene` class in `frontend/src/scenes/game-scene.js`. It owns the player, zombies and other world objects and exposes `update` and `render` methods used by `main.js`.
