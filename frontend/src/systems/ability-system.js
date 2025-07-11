import { createFireball } from "../entities/spells.js";
import { createArrow } from "../entities/arrow.js";
import { updateOrbs } from "../entities/orbs.js";
import {
  getActiveHotbarItem,
  countItem,
  removeItem,
} from "./inventory-system.js";
import { dropLoot } from "../loot.js";

/**
 * Update all player abilities for the current frame.
 *
 * This includes casting fireballs, firing arrows and maintaining any orbiting
 * fire orbs. The various entity arrays are modified directly.
 *
 * @param {object} params - Options object.
 * @param {object} params.player - Player entity.
 * @param {object} params.inventory - Player inventory state.
 * @param {Array} params.fireballs - Array of active fireball entities.
 * @param {Array} params.fireOrbs - Orbiting fire orbs.
 * @param {Array} params.arrows - Array of active arrows.
 * @param {Array} params.zombies - Array of zombie entities.
 * @param {{x:number,y:number}} params.mousePos - Current mouse coordinates.
 * @param {Array} params.worldItems - Items lying on the ground.
 * @param {object} params.hud - HUD object used for notifications.
 * @param {Function} params.renderInventory - Rerender the inventory UI.
 * @param {Function} params.renderHotbar - Rerender the hotbar UI.
 * @param {boolean} params.useHeld - Whether the use key is pressed.
 * @param {boolean} params.aimHeld - Whether the aim key is held.
 * @param {boolean} params.aimRelease - Whether the aim key was released.
 * @param {{value:number}} params.fireballCooldown - Fireball cooldown counter.
 * @returns {{bowAiming:boolean, fireballCooldown:number}} Ability state flags.
 */
export function updateAbilities({
  player,
  inventory,
  fireballs,
  fireOrbs,
  arrows,
  zombies,
  mousePos,
  worldItems,
  hud,
  renderInventory,
  renderHotbar,
  useHeld,
  aimHeld,
  aimRelease,
  fireballCooldown,
}) {
  if (fireballCooldown.value > 0) fireballCooldown.value--;

  const activeSlot = getActiveHotbarItem(inventory);
  if (
    activeSlot &&
    activeSlot.item === "fireball_spell" &&
    player.abilities.fireball &&
    useHeld &&
    fireballCooldown.value <= 0
  ) {
    if (countItem(inventory, "fire_core") > 0) {
      removeItem(inventory, "fire_core", 1);
      const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
      const fb = createFireball(
        player.x,
        player.y,
        dir,
        player.abilities.fireballLevel,
        player.damageBuffMult,
      );
      if (fb) fireballs.push(fb);
      fireballCooldown.value = 15;
      renderInventory();
      renderHotbar();
    } else {
      hud.showPickupMessage("Out of Fire Cores!");
    }
  }

  let bowAiming = false;
  if (player.weapon && player.weapon.type === "bow") {
    bowAiming = aimHeld;
    if (aimRelease) {
      const arrowsLeft = countItem(inventory, "arrow");
      if (arrowsLeft > 0) {
        removeItem(inventory, "arrow", 1);
        const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
        const a = createArrow(player.x, player.y, dir, player.damageBuffMult);
        if (a) arrows.push(a);
        renderInventory();
        renderHotbar();
      } else {
        hud.showPickupMessage("Out of Arrows!");
      }
    }
  }

  if (player.abilities.fireOrb) {
    updateOrbs(fireOrbs, player, zombies, player.abilities.fireOrbLevel, (z) =>
      dropLoot(z, worldItems),
    );
  }

  return { bowAiming, fireballCooldown: fireballCooldown.value };
}
