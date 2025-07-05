export function createZombie(x, y) {
  return { x, y };
}

export function moveTowards(entity, target, speed) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;
  entity.x += (dx / dist) * speed;
  entity.y += (dy / dist) * speed;
}

export function isColliding(a, b, radius) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < radius * 2;
}

export function spawnZombie(width, height, walls = []) {
  let zombie;
  let attempts = 0;
  do {
    zombie = createZombie(Math.random() * width, Math.random() * height);
    attempts++;
  } while (
    attempts < 20 &&
    walls.some((w) => circleRectColliding(zombie, w, 10))
  );
  return zombie;
}

export const SEGMENT_SIZE = 40;

export function generateWalls(width, height, count = 3) {
  const walls = [];
  const gridW = Math.floor(width / SEGMENT_SIZE);
  const gridH = Math.floor(height / SEGMENT_SIZE);
  for (let i = 0; i < count; i++) {
    const pieces = 3 + Math.floor(Math.random() * 3); // 3-5
    let gx = Math.floor(Math.random() * gridW);
    let gy = Math.floor(Math.random() * gridH);
    for (let p = 0; p < pieces; p++) {
      walls.push({
        x: gx * SEGMENT_SIZE,
        y: gy * SEGMENT_SIZE,
        size: SEGMENT_SIZE,
      });
      const dir = Math.random() < 0.5 ? "h" : "v";
      if (dir === "h") {
        gx += Math.random() < 0.5 ? -1 : 1;
      } else {
        gy += Math.random() < 0.5 ? -1 : 1;
      }
      gx = Math.max(0, Math.min(gridW - 1, gx));
      gy = Math.max(0, Math.min(gridH - 1, gy));
    }
  }
  return walls;
}

export function circleRectColliding(circle, rect, radius) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function findPath(start, goal, walls, width, height) {
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
  // top
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x1, y1, x2, y1)) return true;
  // bottom
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x1, y2, x2, y2)) return true;
  // left
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x1, y1, x1, y2)) return true;
  // right
  if (lineIntersectsLine(p1.x, p1.y, p2.x, p2.y, x2, y1, x2, y2)) return true;
  return false;
}

export function hasLineOfSight(start, end, walls, radius = 0) {
  return !walls.some((w) => lineIntersectsRect(start, end, w, radius));
}

export function moveZombie(zombie, player, walls, speed, width, height) {
  if (hasLineOfSight(zombie, player, walls, 10)) {
    moveTowards(zombie, player, speed);
    return;
  }

  // Determine which wall is blocking the direct path to the player
  let block = null;
  let minDist = Infinity;
  for (const w of walls) {
    if (lineIntersectsRect(zombie, player, w, 10)) {
      // approximate distance from zombie to wall center
      const cx = w.x + w.size / 2;
      const cy = w.y + w.size / 2;
      const dist = Math.hypot(zombie.x - cx, zombie.y - cy);
      if (dist < minDist) {
        minDist = dist;
        block = w;
      }
    }
  }

  if (!block) {
    // Shouldn't happen, but fallback to direct movement
    moveTowards(zombie, player, speed);
    return;
  }

  // Candidate corners just outside of the blocking wall
  const pad = 10;
  const corners = [
    { x: block.x - pad, y: block.y - pad },
    { x: block.x + block.size + pad, y: block.y - pad },
    { x: block.x - pad, y: block.y + block.size + pad },
    { x: block.x + block.size + pad, y: block.y + block.size + pad },
  ];

  let target = null;
  let best = Infinity;

  for (const c of corners) {
    if (!hasLineOfSight(zombie, c, walls, 10)) continue;
    const cost =
      Math.hypot(zombie.x - c.x, zombie.y - c.y) +
      Math.hypot(player.x - c.x, player.y - c.y);
    if (cost < best) {
      best = cost;
      target = c;
    }
  }

  if (target) {
    moveTowards(zombie, target, speed);
  } else {
    // If all corners are blocked, slowly head straight toward the player
    moveTowards(zombie, player, speed);
  }
}
