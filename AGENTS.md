# Agent Contribution Guidelines

These rules apply to all contributions by AI agents and human developers.

1. **Update Documentation**: Whenever code is added or changed, update the relevant files in `docs/` and in-code comments.
2. **Maintain Modularity**: Keep game logic, rendering, and backend services separated. Avoid large monolithic files.
3. **Write Tests**: Provide or update unit tests for new functionality in `frontend/tests` or `backend/tests`.
4. **Run Tests Before Commit**: Ensure all tests pass locally before submitting changes.
5. **Keep Dependencies Light**: Avoid introducing heavy libraries without a clear reason.
6. **Follow Code Style**: Use Prettier for JavaScript and Black for Python. Formatting tools should be run prior to commit when possible.
7. **Follow the Directory Structure**: All new frontend code must be placed in the appropriate directory within `frontend/src/` as defined below:
   *   `src/components/`: UI elements (menus, buttons, HUD).
   *   `src/entities/`: Game objects (player, zombies, projectiles).
   *   `src/scenes/`: Game state managers (main menu, gameplay).
   *   `src/systems/`: Core logic that operates on entities (rendering, physics, crafting).
   *   `src/utils/`: Reusable helper functions (math, constants, asset loading).
   *   `src/game-state.js`: A central object for shared game state.
8. **Keep `main.js` Minimal**: The main entry point `frontend/src/main.js` should only be responsible for initializing the game systems and starting the main game loop within the active scene. It should not contain any direct game logic.