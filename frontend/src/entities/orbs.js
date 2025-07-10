export const ORB_RADIUS = 25;
export const ORB_RESPAWN = 180;
export const ORB_SPEED = 0.05;
export const ORB_DAMAGE = 2;

export function createOrbs(count) {
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2,
    cooldown: 0,
    x: 0,
    y: 0,
  }));
}

import { isColliding } from "../game_logic.js";
export function updateOrbs(
  orbs,
  player,
  zombies,
  level = 1,
  onKill = () => {},
) {
  const respawn = level >= 3 ? ORB_RESPAWN / 2 : ORB_RESPAWN;
  for (const orb of orbs) {
    if (orb.cooldown > 0) {
      orb.cooldown--;
      continue;
    }
    orb.angle += ORB_SPEED;
    orb.x = player.x + Math.cos(orb.angle) * ORB_RADIUS;
    orb.y = player.y + Math.sin(orb.angle) * ORB_RADIUS;
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (isColliding(orb, z, 5)) {
        z.health -= ORB_DAMAGE;
        if (z.health <= 0) {
          zombies.splice(i, 1);
          onKill(z);
        }
        orb.cooldown = respawn;
        break;
      }
    }
  }
}
