import { updateFireballs, updateExplosions } from "../entities/spells.js";
import { updateArrows } from "../entities/arrow.js";
import { SEGMENT_SIZE } from "../game_logic.js";
import { isColliding } from "../utils/geometry.js";
import { addItem } from "./inventory-system.js";

/**
 * Determine if a circle collides with a rectangle.
 *
 * @param {{x:number,y:number}} circle - Circle center.
 * @param {{x:number,y:number,size:number}} rect - Rect position and size.
 * @param {number} radius - Radius of the circle.
 * @returns {boolean} True if overlapping.
 */
export function circleRectColliding(circle, rect, radius) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

/**
 * Check collisions between all entities and update their state.
 *
 * @param {object} params - Parameters object.
 * @param {object} params.player - The player entity.
 * @param {Array} params.zombies - Array of zombies.
 * @param {Array} params.arrows - Active arrows.
 * @param {Array} params.fireballs - Active fireballs.
 * @param {Array} params.walls - Wall segments in the world.
 * @param {Array} params.explosions - Active explosions.
 * @param {Array} params.worldItems - Ground items available for pickup.
 * @param {object} params.inventory - Player inventory object.
 * @param {object} params.hud - HUD helper for messages.
 * @param {Function} params.renderInventory - Rerender the inventory UI.
 * @param {Function} params.renderHotbar - Rerender the hotbar UI.
 * @param {Function} params.dropLoot - Function to drop loot from zombies.
 * @param {Record<string,string>} params.materialDrops - Map from wall material to item id.
 * @returns {void}
 */
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
