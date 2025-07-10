import { createFireball } from "../entities/spells.js";
import { createArrow } from "../entities/arrow.js";
import { updateOrbs } from "../entities/orbs.js";
import {
  getActiveHotbarItem,
  countItem,
  removeItem,
} from "./inventory-system.js";
import { dropLoot } from "../loot.js";

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
