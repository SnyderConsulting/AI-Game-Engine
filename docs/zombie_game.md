# Zombie Survival Example

This repository includes a minimal zombie survival demo to showcase basic canvas-based gameplay.

## Running the Example

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The game runs entirely in the browser. Open `http://localhost:3000` to play. Use the arrow keys or WASD to move the green player blob. The player still spawns randomly, but zombies now emerge from a single door placed along the outer edge of the arena. A new zombie steps through this door every 3–5 seconds. They roam toward random destinations so they naturally spread out but will pursue the player once spotted. Grey wall segments are scattered around the level and block both you and the zombies. If a zombie touches you, the game ends and a **Restart** button will appear so you can quickly try again without refreshing the page.

Players now have a small health pool instead of dying instantly. A "Health" display shows the remaining points. Each zombie also has a simple green bar above its head to indicate remaining health.

The arena contains a single melee weapon that can be picked up. Press the spacebar to swing the weapon. The swing now follows the last direction you moved, creating a short arc in front of the player. Zombies hit by the swing take damage, are pushed back slightly, and can be struck from a small distance away. Turrets no longer spawn automatically; future updates will let players place them manually.
