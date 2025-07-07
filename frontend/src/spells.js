export const FIREBALL_SPEED = 3;
export const FIREBALL_RANGE = 8 * 40; // 8 tiles assuming SEGMENT_SIZE=40
export const FIREBALL_BASE_DAMAGE = 1;
export const FIREBALL_BASE_RADIUS = 40;

export function fireballStats(level) {
  let damage = FIREBALL_BASE_DAMAGE;
  let radius = FIREBALL_BASE_RADIUS;
  let pierce = 0;
  if (level >= 2) {
    damage = FIREBALL_BASE_DAMAGE * 2;
    radius = Math.round(FIREBALL_BASE_RADIUS * 1.5);
  }
  if (level >= 3) {
    damage = FIREBALL_BASE_DAMAGE * 3;
    radius = Math.round(FIREBALL_BASE_RADIUS * 2);
    pierce = 1;
  }
  return { damage, radius, pierce };
}

import { circleRectColliding, isColliding } from "./game_logic.js";
export function createFireball(x, y, direction, level = 1, damageMult = 1) {
  const len = Math.hypot(direction.x, direction.y);
  if (len === 0) return null;
  const vx = (direction.x / len) * FIREBALL_SPEED;
  const vy = (direction.y / len) * FIREBALL_SPEED;
  const { damage, radius, pierce } = fireballStats(level);
  return {
    x,
    y,
    vx,
    vy,
    traveled: 0,
    damage: damage * damageMult,
    radius,
    pierce,
  };
}

export function predictFireballEndpoint(x, y, direction, walls, zombies = []) {
  const len = Math.hypot(direction.x, direction.y);
  if (len === 0) return { x, y };
  const stepX = (direction.x / len) * FIREBALL_SPEED;
  const stepY = (direction.y / len) * FIREBALL_SPEED;
  let cx = x;
  let cy = y;
  let traveled = 0;
  while (traveled < FIREBALL_RANGE) {
    cx += stepX;
    cy += stepY;
    traveled += Math.hypot(stepX, stepY);
    if (walls.some((w) => circleRectColliding({ x: cx, y: cy }, w, 4))) {
      break;
    }
    if (zombies.some((z) => isColliding({ x: cx, y: cy }, z, 4))) {
      break;
    }
  }
  return { x: cx, y: cy };
}

export function updateFireballs(
  fireballs,
  zombies,
  walls,
  explosions = [],
  onKill = () => {},
) {
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
      if (explosions) {
        explosions.push({ x: fb.x, y: fb.y, radius: fb.radius, timer: 15 });
      }
      fireballs.splice(i, 1);
    }
  }
}

export function updateExplosions(explosions) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;
    if (explosions[i].timer <= 0) explosions.splice(i, 1);
  }
}
