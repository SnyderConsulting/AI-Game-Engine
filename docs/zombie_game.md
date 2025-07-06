# Zombie Survival Example

This repository includes a minimal zombie survival demo to showcase basic canvas-based gameplay.

## Running the Example

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The game runs entirely in the browser. Open `http://localhost:3000` and you will be greeted with a simple main menu. Click **Start Game** to jump into the action. Use the arrow keys or WASD to move the player character, now drawn using a full sprite rather than a green dot. Zombies also use sprites that rotate to match their movement direction. The player still spawns randomly, but zombies now emerge from a single door placed along the outer edge of the arena. A new zombie steps through this door every 3–5 seconds. They roam toward random destinations so they naturally spread out but will pursue the player once spotted. Grey wall segments are scattered around the level and block both you and the zombies. Zombies now reliably stop when they hit these walls instead of occasionally slipping through them. The fullscreen layout now uses about twenty segments instead of just four. If a zombie touches you, the game ends and a **New Game** button appears so you can immediately play again.

The canvas now automatically resizes to fill the entire browser window so the action takes up all available space.

Players now have a small health pool instead of dying instantly. A "Health" display shows the remaining points. Each zombie also has a simple green bar above its head to indicate remaining health.
The on-screen control instructions are fixed to the bottom-left corner so they never cover the health readout.

The arena contains a baseball bat that starts on the ground. It now appears using its bat icon rather than an orange dot. When collected it is automatically placed in your inventory and the first hotbar slot. Only the item in the **active** hotbar slot can be used. The first slot is active by default and you can switch slots by pressing the number keys **1-5**. If the baseball bat is not in the active slot it cannot be swung. Press the spacebar to swing when it is equipped. Zombies hit by the swing take damage, are pushed back slightly, and can be struck from a small distance away. Turrets no longer spawn automatically; future updates will let players place them manually.

## Inventory System

Press **I** (or **E**) to open the 5x5 inventory grid. Keys are matched case-insensitively so holding Shift won't prevent the menus from toggling. Items stack up to 10 per slot. A five slot hotbar sits at the bottom of the screen for quick access and now appears on a dark background so it is easy to see. Drag to rearrange items or right click to move them to the hotbar. Use the number keys **1-5** to change the active slot. Both the inventory and crafting windows can be dragged by their top bars and will remember their last position when closed.
Inventory and hotbar slots now display the item icons found in the `assets` folder. If an icon is missing for an item, a `?` will appear instead.

## Zombie Drops

Zombies may drop **core**, **flesh**, or **teeth** when killed. Walk over a dropped icon to collect it if you have space. Items remain on the ground when the inventory is full and a brief pickup message appears when collecting or using items.

## Crafting

Press **C** to open the crafting menu at any time. Only recipes for which you own at least one ingredient are shown. Each entry now displays an icon of the resulting item along with icons for all required materials and their counts. Clicking a recipe crafts it instantly if you have enough parts. Ingredients are removed from the inventory and the crafted item is placed there as well, or dropped at your feet if no space remains.

## Containers

Cardboard boxes are scattered around the arena. They are now rendered using a box icon instead of a brown square. Stand next to one and hold **F** to loot it. A progress bar appears in the center of the screen for three seconds while you search. When the bar completes the box opens. Each box can hold a single Medkit with a 64% chance. If found and your inventory has space, the Medkit is automatically added. Otherwise, the box keeps the item and displays "Inventory Full". Empty boxes show "Container Empty" and cannot be looted again. Opened boxes appear faded so you know they have been searched.

Using a Medkit from the hotbar restores up to 3 health without exceeding your maximum.
