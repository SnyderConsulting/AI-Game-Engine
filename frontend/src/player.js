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
    abilities: {
      fireball: false,
      fireballLevel: 0,
      fireOrb: false,
      fireOrbLevel: 0,
      phoenixRevival: false,
      phoenixRevivalLevel: 0,
    },
    fireMutationPoints: 0,
    phoenixCooldown: 0,
    damageBuffTimer: 0,
    damageBuffMult: 1,
  };
}

export function resetPlayerForNewGame(player, PLAYER_MAX_HEALTH) {
  player.health = PLAYER_MAX_HEALTH;
  player.damageCooldown = 0;
  player.weapon = null;
  player.swingTimer = 0;
  player.abilities.fireball = false;
  player.abilities.fireballLevel = 0;
  player.abilities.fireOrb = false;
  player.abilities.fireOrbLevel = 0;
  player.abilities.phoenixRevival = false;
  player.abilities.phoenixRevivalLevel = 0;
  player.phoenixCooldown = 0;
  player.damageBuffTimer = 0;
  player.damageBuffMult = 1;
  player.fireMutationPoints = 0;
}

export function tryPhoenixRevival(player, PLAYER_MAX_HEALTH) {
  if (
    player.abilities.phoenixRevival &&
    player.phoenixCooldown <= 0 &&
    player.health <= 0
  ) {
    const lvl = player.abilities.phoenixRevivalLevel;
    const hpPerc = [0, 0.1, 0.3, 0.5][lvl];
    const dmg = [0, 1.25, 1.35, 1.5][lvl];
    const dur = [0, 300, 480, 720][lvl];
    player.health = Math.max(1, Math.round(PLAYER_MAX_HEALTH * hpPerc));
    player.phoenixCooldown = 7200;
    player.damageBuffMult = dmg;
    player.damageBuffTimer = dur;
    return true;
  }
  return false;
}
