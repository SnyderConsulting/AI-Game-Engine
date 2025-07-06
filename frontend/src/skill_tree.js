export function unlockFireball(player, inventory, addItem, moveToHotbar) {
  if (player.fireMutationPoints < 2 || player.abilities.fireball) return false;
  player.fireMutationPoints -= 2;
  player.abilities.fireball = true;
  if (
    !inventory.hotbar.some((s) => s.item === "fireball_spell") &&
    !inventory.slots.some((s) => s.item === "fireball_spell")
  ) {
    const added = addItem(inventory, "fireball_spell", 1);
    if (added) {
      const idx = inventory.slots.findIndex((s) => s.item === "fireball_spell");
      if (idx !== -1) moveToHotbar(inventory, idx, 0);
    }
  }
  return true;
}
