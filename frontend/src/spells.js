export const FIREBALL_SPEED = 3;
export const FIREBALL_RANGE = 8 * 40; // 8 tiles assuming SEGMENT_SIZE=40
export const FIREBALL_DAMAGE = 3;

import { circleRectColliding, isColliding } from "./game_logic.js";

export function createFireball(x, y, direction) {
  const len = Math.hypot(direction.x, direction.y);
  if (len === 0) return null;
  const vx = (direction.x / len) * FIREBALL_SPEED;
  const vy = (direction.y / len) * FIREBALL_SPEED;
  return { x, y, vx, vy, traveled: 0 };
}

export function updateFireballs(fireballs, zombies, walls, onKill = () => {}) {
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fb = fireballs[i];
    fb.x += fb.vx;
    fb.y += fb.vy;
    fb.traveled += Math.hypot(fb.vx, fb.vy);
    let remove = fb.traveled >= FIREBALL_RANGE;
    if (!remove && walls.some((w) => circleRectColliding(fb, w, 4))) {
      remove = true;
    }
    if (!remove) {
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        if (isColliding(fb, z, 4)) {
          z.health -= FIREBALL_DAMAGE;
          if (z.health <= 0) {
            zombies.splice(j, 1);
            onKill(z);
          }
          remove = true;
          break;
        }
      }
    }
    if (remove) fireballs.splice(i, 1);
  }
}
