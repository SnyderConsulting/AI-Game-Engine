export const FIREBALL_SPEED = 3;
export const FIREBALL_RANGE = 8 * 40; // 8 tiles assuming SEGMENT_SIZE=40
export const FIREBALL_BASE_DAMAGE = 3;
export const FIREBALL_BASE_RADIUS = 20;

export function fireballStats(level) {
  let damage = FIREBALL_BASE_DAMAGE;
  let radius = FIREBALL_BASE_RADIUS;
  let pierce = 0;
  if (level >= 2) {
    damage = Math.round(FIREBALL_BASE_DAMAGE * 1.25);
    radius = Math.round(FIREBALL_BASE_RADIUS * 1.25);
  }
  if (level >= 3) {
    radius = Math.round(FIREBALL_BASE_RADIUS * 1.5);
    pierce = 1;
  }
  return { damage, radius, pierce };
}

import { circleRectColliding, isColliding } from "./game_logic.js";
export function createFireball(x, y, direction, level = 1) {
  const len = Math.hypot(direction.x, direction.y);
  if (len === 0) return null;
  const vx = (direction.x / len) * FIREBALL_SPEED;
  const vy = (direction.y / len) * FIREBALL_SPEED;
  const { damage, radius, pierce } = fireballStats(level);
  return { x, y, vx, vy, traveled: 0, damage, radius, pierce };
}

export function updateFireballs(fireballs, zombies, walls, onKill = () => {}) {
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fb = fireballs[i];
    fb.x += fb.vx;
    fb.y += fb.vy;
    fb.traveled += Math.hypot(fb.vx, fb.vy);
    let explode = false;
    if (fb.traveled >= FIREBALL_RANGE) {
      explode = true;
    } else if (walls.some((w) => circleRectColliding(fb, w, 4))) {
      explode = true;
    } else {
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        if (isColliding(fb, z, 4)) {
          z.health -= fb.damage;
          if (z.health <= 0) {
            zombies.splice(j, 1);
            onKill(z);
          }
          if (fb.pierce > 0) {
            fb.pierce -= 1;
          } else {
            explode = true;
          }
          break;
        }
      }
    }
    if (explode) {
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        if (Math.hypot(z.x - fb.x, z.y - fb.y) <= fb.radius) {
          z.health -= fb.damage;
          if (z.health <= 0) {
            zombies.splice(j, 1);
            onKill(z);
          }
        }
      }
      fireballs.splice(i, 1);
    }
  }
}
