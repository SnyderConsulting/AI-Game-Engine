export function upgradeFireball(player, inventory, addItem, moveToHotbar) {
  const level = player.abilities.fireballLevel || 0;
  const costs = [0, 2, 2, 3];
  if (level >= 3) return false;
  const cost = costs[level + 1];
  if (player.fireMutationPoints < cost) return false;
  player.fireMutationPoints -= cost;
  player.abilities.fireball = true;
  player.abilities.fireballLevel = level + 1;
  if (level === 0) {
    if (
      !inventory.hotbar.some((s) => s.item === "fireball_spell") &&
      !inventory.slots.some((s) => s.item === "fireball_spell")
    ) {
      const added = addItem(inventory, "fireball_spell", 1);
      if (added) {
        const idx = inventory.slots.findIndex(
          (s) => s.item === "fireball_spell",
        );
        if (idx !== -1) moveToHotbar(inventory, idx, 0);
      }
    }
  }
  return true;
}
