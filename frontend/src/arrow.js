export const ARROW_SPEED = 3;
export const ARROW_DAMAGE = 2;

import { circleRectColliding, isColliding } from "./game_logic.js";

export function createArrow(x, y, direction) {
  const len = Math.hypot(direction.x, direction.y);
  if (len === 0) return null;
  const vx = (direction.x / len) * ARROW_SPEED;
  const vy = (direction.y / len) * ARROW_SPEED;
  return { x, y, vx, vy };
}

export function updateArrows(arrows, zombies, walls, onKill = () => {}) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.x += a.vx;
    a.y += a.vy;
    let remove = false;
    if (walls.some((w) => circleRectColliding(a, w, 2))) {
      remove = true;
    } else {
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        if (isColliding(a, z, 2)) {
          z.health -= ARROW_DAMAGE;
          if (z.health <= 0) {
            zombies.splice(j, 1);
            onKill(z);
          }
          remove = true;
          break;
        }
      }
    }
    if (remove) arrows.splice(i, 1);
  }
}
