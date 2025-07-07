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

export function upgradeFireOrb(player) {
  const level = player.abilities.fireOrbLevel || 0;
  const costs = [0, 1, 2, 3];
  if (level >= 3) return false;
  const cost = costs[level + 1];
  if (player.fireMutationPoints < cost) return false;
  player.fireMutationPoints -= cost;
  player.abilities.fireOrb = true;
  player.abilities.fireOrbLevel = level + 1;
  return true;
}

export function upgradePhoenixRevival(player) {
  const level = player.abilities.phoenixRevivalLevel || 0;
  const costs = [0, 4, 3, 4];
  if (level >= 3) return false;
  const cost = costs[level + 1];
  if (player.fireMutationPoints < cost) return false;
  player.fireMutationPoints -= cost;
  player.abilities.phoenixRevival = true;
  player.abilities.phoenixRevivalLevel = level + 1;
  return true;
}
