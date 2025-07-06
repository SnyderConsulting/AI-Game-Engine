export function getItemCooldown(id, player, fireballCooldown) {
  if (id === "fireball_spell") return { remaining: fireballCooldown, max: 15 };
  if (id === "baseball_bat") return { remaining: player.swingTimer, max: 10 };
  return { remaining: 0, max: 0 };
}
