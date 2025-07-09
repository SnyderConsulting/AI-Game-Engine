# Zombie Survival Example

This repository includes a minimal zombie survival demo to showcase basic canvas-based gameplay.

## Running the Example

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The game runs entirely in the browser. Open `http://localhost:3000` and you will be greeted with a simple main menu. Click **Start Game** to jump into the action. Use the arrow keys or WASD to move the player character, now drawn using a full sprite rather than a green dot. Zombies also use sprites that rotate to match their movement direction. The player still spawns randomly, but zombies now emerge from a single door placed along the outer edge of the arena. Five basic zombies enter through this door at the beginning of **Wave&nbsp;1**, shown in a counter at the top right which now uses black text for visibility. Once all five are defeated a Victory screen appears with a button to play again.
Zombies avoid overlapping when they move, so only one can occupy a grid space at a time and new zombies won't spawn on top of existing ones.
The spawn door is guaranteed to have an open space just inside the arena so
fresh zombies are never trapped when they appear.

Shelving now forms organized aisles built from steel, wood, and plastic segments. These shelves are breakable, with steel being the hardest to destroy and plastic the weakest. Damaged shelves flash and briefly show a health bar before collapsing. The layout generator spaces aisles widely so there is plenty of room to maneuver while still providing clear paths and chokepoints.
Use crafted tools like the **Hammer**, **Crowbar**, or **Axe** to chip away at shelves. Melee swings now deal more damage so only a handful are needed to break a shelf. Once its health reaches zero the shelf disappears, dropping building materials.
Collision detection for melee swings uses the closest point on the shelf, so striking from the side reliably damages it.

If a zombie touches you, the game ends and a **New Game** button appears so you can immediately play again.

The canvas now automatically resizes to fill the entire browser window so the action takes up all available space.

Players now have a small health pool instead of dying instantly. A "Health" display shows the remaining points. Each zombie has a green health bar with a red background above its head so damage is immediately visible.
The on-screen control instructions are fixed to the bottom-left corner so they never cover the health readout.
The player character now always faces your mouse cursor. A custom cursor icon marks the target location so you can aim while moving in any direction.

The arena contains a baseball bat that starts on the ground. It now appears using its bat icon rather than an orange dot. When collected it automatically occupies the first open hotbar slot. Only the item in the **active** hotbar slot can be used. The first slot is active by default and you can switch slots by pressing the number keys **1-5**. If the baseball bat is not in the active slot it cannot be swung. Press the **Space** key or left mouse button to swing when it is equipped. Zombies hit by the swing take damage, are pushed back slightly, and can be struck from a small distance away. Earlier builds included turrets, but they have been removed to simplify gameplay.

## Inventory System

Press **I** (or **E**) to open the 5x5 inventory grid. Keys are matched case-insensitively so holding Shift won't prevent the menus from toggling. Items stack up to 10 per slot. A five slot hotbar sits at the bottom of the screen for quick access and now appears on a dark background so it is easy to see. Newly picked up items fill the first empty hotbar slot before using inventory space. Drag to rearrange items or right click to move them to the hotbar. Quick move only works when a hotbar slot is free and does nothing on empty inventory slots. Clicking any inventory slot and then a hotbar slot (or vice versa) now swaps their contents even if one is empty. Use the number keys **1-5** to change the active slot. Both the inventory and crafting windows can be dragged by their top bars and will remember their last position when closed.
Press **K** to open the skill tree and spend mutation points.
The tree now highlights skills that are available to unlock. Clicking any node
opens a panel describing the ability and lists what each level does along with
its cost. The panel also shows your current level and the cost for the next
upgrade. The upgrade button is disabled if you lack points so you can quickly
see what to work toward without cluttering the screen with distant skills.
Inventory and hotbar slots now display the item icons found in the `assets` folder. If an icon is missing for an item, a `?` will appear instead.
Hotbar items with an active cooldown display a gray, semi-transparent circle that recedes clockwise as the timer expires.

## Zombie Drops

Zombies may drop **core**, **flesh**, or **teeth** when killed. Walk over a dropped icon to collect it if you have space. Items remain on the ground when the inventory is full and a brief pickup message appears when collecting or using items.

Fire Zombies have a 75% chance to drop a glowing **Fire Core**. Cores behave like other loot and stack in your inventory.

## Crafting

Press **C** to open the crafting menu at any time. Only recipes for which you own at least one ingredient are shown. Each entry now displays an icon of the resulting item along with icons for all required materials and their counts. Clicking a recipe crafts it instantly if you have enough parts. Ingredients are removed from the inventory and the crafted item is placed there as well, or dropped at your feet if no space remains.

## Containers

Cardboard boxes are scattered around the arena. They are now rendered using a box icon instead of a brown square. Stand next to one and hold **F** to loot it. A progress bar appears in the center of the screen for three seconds while you search. When the bar completes the box opens. Each box now contains **Scrap Metal**, **Duct Tape**, **Nails**, or a **Medkit** with equal probability. If there is room in your hotbar or inventory the item is added automatically. Otherwise a brief "Inventory Full" message appears. Opened boxes appear faded so you know they have been searched.

Shelves can now be searched the same way. Stand beside a shelf segment, face it, and hold **F** to rummage through. Searching takes time and each shelf can only be looted once. Looted shelves fade just like opened boxes. Shelves usually contain nothing, but very rarely yield extra crafting materials like **Scrap Metal**, **Duct Tape**, **Nails**, **Plastic Fragments**, **Wood Planks**, or **Steel Plates**.

Equip a Medkit and press the **Space** key or left mouse button to restore up to 3 health without exceeding your maximum.

## Fire Zombies

Some zombies emerge imbued with flame. These **Fire Zombies** appear with a red tint and glow effect so they are easy to spot. They behave like normal zombies but spawn with a 20% probability whenever a new zombie enters through the door.

Collecting Fire Cores unlocks a new recipe:

- **Fire Mutation Serum** - Combine three Fire Cores to craft. Equip the serum and press the **Space** key or left mouse button to inject it. Each injection grants one **Fire Mutation Point** you can spend in the skill tree (press **K** to open).

## Fireball Ability

Spend **2 Fire Mutation Points** in the skill tree to unlock the _Fireball_ ability. Unlocking places a Fireball icon in your hotbar. Equip it like any other item by selecting the slot with the number keys. While equipped press **Space** or left mouse button to hurl a blazing projectile toward the mouse cursor. Each cast consumes one Fire Core from your inventory. The Fireball travels about eight tiles, damaging zombies it hits and dissipating on impact with walls or enemies. A dashed line preview displays the path and a dotted circle shows the blast radius before you cast. The preview shortens when a wall or zombie blocks the shot. When the Fireball explodes a faint red circle briefly highlights the impact area. If you attempt to cast without any cores a brief "Out of Fire Cores!" message appears. Starting a new game resets points and skills so you must craft the serum again in future runs.

### Fireball Upgrades

After unlocking the ability you can spend more points to enhance it:

| Level | Effect                                            | Cost     |
| ----- | ------------------------------------------------- | -------- |
| **1** | Low damage, large explosion                       | Included |
| **2** | +1 damage, +50% radius                            | 2 points |
| **3** | +1 damage again, +100% radius, pierces one zombie | 3 points |

## Fire Orb Passive

Spend **1 Fire Mutation Point** to summon a flaming orb that circles your
character. The orb vanishes on contact with a zombie and reforms after a short
delay. Additional points add a second orb and shorten the respawn time.

| Level | Effect                         | Cost |
| ----- | ------------------------------ | ---- |
| **1** | 1 orbiting orb                 | 1    |
| **2** | Two orbs revolve around player | 2    |
| **3** | Respawn time halved            | 3    |

## Phoenix Revival Passive

This ultimate skill costs **4 Fire Mutation Points** to unlock. If you would die
with the ability ready, you instead revive with **1 health** and a temporary
damage boost. Nearby zombies are knocked away with much greater force when this
happens, giving you a moment to escape. The skill then goes on cooldown for two minutes. The revival
check happens whenever your HP reaches zero, regardless of what caused the
damage.

| Level | Damage Buff | Duration | Cost |
| ----- | ----------- | -------- | ---- |
| **1** | +25%        | 5s       | 4    |
| **2** | +35%        | 8s       | 3    |
| **3** | +50%        | 12s      | 4    |

## Bow and Arrow

Wood planks harvested from wooden shelves enable ranged equipment:

- **Bow** – Requires 3 Wood Planks and 2 Nails.
- **Arrows** – Crafted in batches of 5 using 1 Wood Plank and 1 Nail.

Equip the Bow in your hotbar. Hold the right mouse button or **Space** to aim, then release to fire an arrow toward the cursor. While aiming a dashed line previews the path and stops when hitting a wall or zombie. Each shot consumes one Arrow. The current arrow count appears below the health display and an "Out of Arrows!" notification shows when empty.

## Breaking & Crafting Loop

1. Loot cardboard boxes for Scrap Metal, Duct Tape and Nails.
2. Combine these to craft a Hammer, Crowbar or Axe.
3. Use those tools to destroy shelves and gather Plastic Fragments, Wood Planks and Steel Plates.
4. Craft advanced gear like Baseball Bats, Bows, Reinforced Axes and Wood Barricades using the harvested materials.
