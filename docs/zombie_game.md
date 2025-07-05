# Zombie Survival Example

This repository includes a minimal zombie survival demo to showcase basic canvas-based gameplay.

## Running the Example

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The game runs entirely in the browser. Open `http://localhost:3000` to play. Use the arrow keys or WASD to move the green player blob. Red zombies spawn around the map (never inside walls). They charge straight toward the player whenever they have a clear line of sight, otherwise they calculate a short path around any blocking walls. Grey wall segments are scattered around the level and block both you and the zombies. If a zombie touches you, the game ends and a **Restart** button will appear so you can quickly try again without refreshing the page.
