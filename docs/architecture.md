# Architecture Overview

This project is split into separate frontend and backend components.

- **Frontend**: HTML5/JavaScript client rendered on a `<canvas>` element using a lightweight setup with Vite. Game logic is kept independent from rendering to encourage modularity. Source files under `frontend/src/` are organized into `components/`, `entities/`, `scenes/`, `systems/` and `utils/` directories. Common game objects like the player, arrows and floating orbs live in the `entities` folder.
  Zombie behavior resides in `frontend/src/entities/zombie.js` to keep AI code modular.
  Reusable math helpers like `moveTowards` and `isColliding` live in `frontend/src/utils/geometry.js`.
- **Backend**: Python FastAPI service providing API endpoints. Initially exposes a simple health check and is prepared for future features like multiplayer or persistence.

Both sides communicate via HTTP or WebSockets. The repository emphasizes clear separation of concerns and maintainable code.
