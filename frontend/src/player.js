export function createPlayer(PLAYER_MAX_HEALTH) {
  return {
    x: 0,
    y: 0,
    speed: 2,
    health: PLAYER_MAX_HEALTH,
    damageCooldown: 0,
    weapon: null,
    facing: { x: 1, y: 0 },
    swingTimer: 0,
    abilities: { fireball: false },
    fireMutationPoints: 0,
  };
}

export function resetPlayerForNewGame(player, PLAYER_MAX_HEALTH) {
  player.health = PLAYER_MAX_HEALTH;
  player.damageCooldown = 0;
  player.weapon = null;
  player.swingTimer = 0;
  player.abilities.fireball = false;
  player.fireMutationPoints = 0;
}
