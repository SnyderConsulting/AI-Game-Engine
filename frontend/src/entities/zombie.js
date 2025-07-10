import { circleRectColliding, SEGMENT_SIZE } from "../game_logic.js";
import { moveTowards, isColliding } from "../utils/geometry.js";

export const ZOMBIE_MAX_HEALTH = 2;
export const FIRE_ZOMBIE_CHANCE = 0.2;
export const TRIGGER_DISTANCE = 60;

export function createZombie(x, y, variant = "normal") {
  return {
    x,
    y,
    facing: { x: 0, y: 1 },
    triggered: false,
    dest: null,
    idleTimer: 0,
    wanderAngle: 0,
    wanderTimer: 0,
    health: ZOMBIE_MAX_HEALTH,
    attackCooldown: 0,
    variant,
  };
}

export function createFireZombie(x, y) {
  return createZombie(x, y, "fire");
}

export function spawnZombie(width, height, walls = []) {
  let zombie;
  let attempts = 0;
  do {
    const variant = Math.random() < FIRE_ZOMBIE_CHANCE ? "fire" : "normal";
    zombie = createZombie(
      Math.random() * width,
      Math.random() * height,
      variant,
    );
    attempts++;
  } while (
    attempts < 20 &&
    walls.some((w) => circleRectColliding(zombie, w, 10))
  );
  return zombie;
}

export function spawnZombieAtDoor(door) {
  const variant = Math.random() < FIRE_ZOMBIE_CHANCE ? "fire" : "normal";
  return createZombie(door.x, door.y, variant);
}

export function spawnZombieWave(
  count,
  door,
  width,
  height,
  variant = "normal",
  walls = [],
) {
  const spawnX = Math.min(Math.max(door.x, 1), width - 1);
  const spawnY = Math.min(Math.max(door.y, 1), height - 1);
  const zombies = [];
  for (let i = 0; i < count; i++) {
    let pos;
    let attempts = 0;
    do {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (SEGMENT_SIZE / 2);
      pos = {
        x: Math.min(Math.max(spawnX + Math.cos(angle) * dist, 1), width - 1),
        y: Math.min(Math.max(spawnY + Math.sin(angle) * dist, 1), height - 1),
      };
      attempts++;
    } while (
      attempts < 20 &&
      (walls.some((w) => circleRectColliding(pos, w, 10)) ||
        zombies.some((z) => isColliding(z, pos, 10)))
    );
    zombies.push(createZombie(pos.x, pos.y, variant));
  }
  return zombies;
}

export function separateFromZombies(zombie, zombies, dist = 20) {
  for (const z of zombies) {
    if (z === zombie) continue;
    const dx = zombie.x - z.x;
    const dy = zombie.y - z.y;
    const d = Math.hypot(dx, dy);
    if (d > 0 && d < dist) {
      const push = dist - d;
      zombie.x += (dx / d) * push;
      zombie.y += (dy / d) * push;
    }
  }
}

export function findPath(start, goal, walls, width, height, _blockers = []) {
  const gridW = Math.floor(width / SEGMENT_SIZE);
  const gridH = Math.floor(height / SEGMENT_SIZE);
  const sx = Math.floor(start.x / SEGMENT_SIZE);
  const sy = Math.floor(start.y / SEGMENT_SIZE);
  const gx = Math.floor(goal.x / SEGMENT_SIZE);
  const gy = Math.floor(goal.y / SEGMENT_SIZE);
  const blocked = new Set(
    walls.map((w) => `${w.x / SEGMENT_SIZE},${w.y / SEGMENT_SIZE}`),
  );
  const queue = [[sx, sy]];
  const key = (x, y) => `${x},${y}`;
  const cameFrom = new Map([[key(sx, sy), null]]);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    if (cx === gx && cy === gy) break;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue;
      const nKey = key(nx, ny);
      if (blocked.has(nKey) || cameFrom.has(nKey)) continue;
      cameFrom.set(nKey, [cx, cy]);
      queue.push([nx, ny]);
    }
  }

  const path = [];
  let cur = [gx, gy];
  while (cur) {
    path.unshift(cur);
    const parent = cameFrom.get(key(cur[0], cur[1]));
    cur = parent || null;
  }
  if (path[0][0] !== sx || path[0][1] !== sy) return [];
  return path;
}

export function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denom === 0) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function lineIntersectsRect(p1, p2, rect, pad = 0) {
  const x1 = rect.x - pad;
  const y1 = rect.y - pad;
  const x2 = rect.x + rect.size + pad;
  const y2 = rect.y + rect.size + pad;
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x1, y1, x2, y1)) return true;
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x1, y2, x2, y2)) return true;
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x1, y1, x1, y2)) return true;
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x2, y1, x2, y2)) return true;
  return false;
}

export function hasLineOfSight(start, end, walls, radius = 0) {
  return !walls.some((w) => lineIntersectsRect(start, end, w, radius));
}

export function wanderZombie(
  zombie,
  walls,
  width,
  height,
  speed = 0.2,
  zombies = [],
) {
  if (zombie.idleTimer > 0) {
    zombie.idleTimer--;
    return;
  }
  if (!zombie.dest) {
    zombie.dest = { x: Math.random() * width, y: Math.random() * height };
    let attempts = 0;
    while (
      attempts < 20 &&
      walls.some((w) => circleRectColliding(zombie.dest, w, 10))
    ) {
      zombie.dest = { x: Math.random() * width, y: Math.random() * height };
      attempts++;
    }
  }
  const dist = Math.hypot(zombie.dest.x - zombie.x, zombie.dest.y - zombie.y);
  if (dist < 5) {
    zombie.dest = null;
    zombie.idleTimer = 60 + Math.random() * 120;
    return;
  }
  const path = findPath(zombie, zombie.dest, walls, width, height, zombies);
  if (path.length < 2) {
    const prevX = zombie.x;
    const prevY = zombie.y;
    moveTowards(zombie, zombie.dest, speed);
    if (walls.some((w) => circleRectColliding(zombie, w, 10))) {
      zombie.x = prevX;
      zombie.y = prevY;
    } else {
      separateFromZombies(zombie, zombies);
    }
    return;
  }
  const [nx, ny] = path[1];
  const target = {
    x: nx * SEGMENT_SIZE + SEGMENT_SIZE / 2,
    y: ny * SEGMENT_SIZE + SEGMENT_SIZE / 2,
  };
  const prevX = zombie.x;
  const prevY = zombie.y;
  moveTowards(zombie, target, speed);
  if (walls.some((w) => circleRectColliding(zombie, w, 10))) {
    zombie.x = prevX;
    zombie.y = prevY;
  } else {
    separateFromZombies(zombie, zombies);
  }
}

export function moveZombie(
  zombie,
  player,
  walls,
  speed,
  width,
  height,
  zombies = [],
) {
  const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);
  if (!zombie.triggered) {
    if (dist <= TRIGGER_DISTANCE && hasLineOfSight(zombie, player, walls, 10)) {
      zombie.triggered = true;
    } else {
      wanderZombie(zombie, walls, width, height, 0.2, zombies);
      return;
    }
  }
  if (hasLineOfSight(zombie, player, walls, 10)) {
    const prevX = zombie.x;
    const prevY = zombie.y;
    moveTowards(zombie, player, speed);
    if (walls.some((w) => circleRectColliding(zombie, w, 10))) {
      zombie.x = prevX;
      zombie.y = prevY;
    } else {
      separateFromZombies(zombie, zombies);
    }
    return;
  }
  const path = findPath(zombie, player, walls, width, height, zombies);
  if (path.length < 2) {
    const prevX = zombie.x;
    const prevY = zombie.y;
    moveTowards(zombie, player, speed);
    if (walls.some((w) => circleRectColliding(zombie, w, 10))) {
      zombie.x = prevX;
      zombie.y = prevY;
    } else {
      separateFromZombies(zombie, zombies);
    }
    return;
  }
  const [nx, ny] = path[1];
  const target = {
    x: nx * SEGMENT_SIZE + SEGMENT_SIZE / 2,
    y: ny * SEGMENT_SIZE + SEGMENT_SIZE / 2,
  };
  const prevX = zombie.x;
  const prevY = zombie.y;
  moveTowards(zombie, target, speed);
  if (walls.some((w) => circleRectColliding(zombie, w, 10))) {
    zombie.x = prevX;
    zombie.y = prevY;
  } else {
    separateFromZombies(zombie, zombies);
  }
}

export function attackZombies(
  player,
  zombies,
  damage = 1,
  range = 30,
  direction = null,
  arc = Math.PI / 2,
  knockback = 0,
) {
  const cosHalf = Math.cos(arc / 2);
  const dirNorm = direction
    ? (() => {
        const len = Math.hypot(direction.x, direction.y);
        if (len === 0) return null;
        return { x: direction.x / len, y: direction.y / len };
      })()
    : null;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const dx = z.x - player.x;
    const dy = z.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) continue;
    let withinArc = true;
    if (dirNorm) {
      withinArc = (dx * dirNorm.x + dy * dirNorm.y) / dist >= cosHalf;
    }
    if (withinArc) {
      z.health -= damage;
      if (knockback && dist > 0) {
        z.x += (dx / dist) * knockback;
        z.y += (dy / dist) * knockback;
      }
      if (z.health <= 0) {
        zombies.splice(i, 1);
      }
    }
  }
}

export function attackZombiesWithKills(
  player,
  zombies,
  damage = 1,
  range = 30,
  direction = null,
  arc = Math.PI / 2,
  knockback = 0,
) {
  const killed = [];
  const cosHalf = Math.cos(arc / 2);
  const dirNorm = direction
    ? (() => {
        const len = Math.hypot(direction.x, direction.y);
        if (len === 0) return null;
        return { x: direction.x / len, y: direction.y / len };
      })()
    : null;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const dx = z.x - player.x;
    const dy = z.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) continue;
    let withinArc = true;
    if (dirNorm) {
      withinArc = (dx * dirNorm.x + dy * dirNorm.y) / dist >= cosHalf;
    }
    if (withinArc) {
      z.health -= damage;
      if (knockback && dist > 0) {
        z.x += (dx / dist) * knockback;
        z.y += (dy / dist) * knockback;
      }
      if (z.health <= 0) {
        killed.push(z);
        zombies.splice(i, 1);
      }
    }
  }
  return killed;
}

export function updateZombies(zombies, player, walls, width, height) {
  for (const z of zombies) {
    moveZombie(z, player, walls, 1, width, height, zombies);
    if (z.attackCooldown > 0) z.attackCooldown--;
    if (
      isColliding(z, player, 10) &&
      player.damageCooldown <= 0 &&
      z.attackCooldown <= 0
    ) {
      player.health--;
      player.damageCooldown = 30;
      z.attackCooldown = 30;
    }
  }
}

export function renderZombies(ctx, zombies, zombieSprite, fireZombieSprite) {
  zombies.forEach((z) => {
    if (z.variant === "fire") {
      const grad = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, 20);
      grad.addColorStop(0, "rgba(255,100,0,0.8)");
      grad.addColorStop(1, "rgba(255,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(z.x, z.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    const img = z.variant === "fire" ? fireZombieSprite : zombieSprite;
    const angle = Math.atan2(z.facing.y, z.facing.x) - Math.PI / 2;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(angle);
    ctx.drawImage(img, -16, -16, 32, 32);
    ctx.restore();
    ctx.fillStyle = "red";
    ctx.fillRect(z.x - 10, z.y - 16, 20, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(z.x - 10, z.y - 16, (z.health / ZOMBIE_MAX_HEALTH) * 20, 4);
  });
}
