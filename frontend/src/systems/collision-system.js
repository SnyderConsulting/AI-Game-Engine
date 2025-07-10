import { updateFireballs, updateExplosions } from "../spells.js";
import { updateArrows } from "../entities/arrow.js";
import { SEGMENT_SIZE } from "../game_logic.js";
import { isColliding } from "../utils/geometry.js";
import { addItem } from "../inventory.js";

export function circleRectColliding(circle, rect, radius) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function checkAllCollisions({
  player,
  zombies,
  arrows,
  fireballs,
  walls,
  explosions,
  worldItems,
  inventory,
  hud,
  renderInventory,
  renderHotbar,
  dropLoot,
  materialDrops,
}) {
  updateFireballs(fireballs, zombies, walls, explosions, (z) =>
    dropLoot(z, worldItems),
  );
  updateExplosions(explosions);
  updateArrows(
    arrows,
    zombies,
    walls,
    (z) => dropLoot(z, worldItems),
    (w) =>
      worldItems.push({
        x: w.x + SEGMENT_SIZE / 2,
        y: w.y + SEGMENT_SIZE / 2,
        type: materialDrops[w.material],
        count: 1,
      }),
  );

  // handle player colliding with zombies
  for (const z of zombies) {
    if (
      isColliding(z, player, 10) &&
      player.damageCooldown <= 0 &&
      z.attackCooldown <= 0
    ) {
      player.health--;
      player.damageCooldown = 30;
      z.attackCooldown = 30;
    }
  }

  // handle player picking up world items
  for (let i = worldItems.length - 1; i >= 0; i--) {
    const it = worldItems[i];
    if (isColliding(player, it, 10)) {
      if (addItem(inventory, it.type, it.count)) {
        worldItems.splice(i, 1);
        hud.showPickupMessage(`Picked up ${it.type}`);
        renderInventory();
        renderHotbar();
      }
    }
  }
}
