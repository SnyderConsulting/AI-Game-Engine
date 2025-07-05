export function createZombie(x, y) {
  return { x, y, triggered: false, wanderAngle: 0, wanderTimer: 0 };
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
export const TRIGGER_DISTANCE = 60;

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

export function wanderZombie(zombie, walls, width, height, speed = 0.2) {
  if (zombie.wanderTimer <= 0) {
    zombie.wanderAngle = Math.random() * Math.PI * 2;
    zombie.wanderTimer = 30 + Math.random() * 30;
  }
  const prevX = zombie.x;
  const prevY = zombie.y;
  zombie.x += Math.cos(zombie.wanderAngle) * speed;
  zombie.y += Math.sin(zombie.wanderAngle) * speed;
  zombie.x = Math.max(10, Math.min(width - 10, zombie.x));
  zombie.y = Math.max(10, Math.min(height - 10, zombie.y));
  if (walls.some((w) => circleRectColliding(zombie, w, 10))) {
    zombie.x = prevX;
    zombie.y = prevY;
    zombie.wanderTimer = 0;
  } else {
    zombie.wanderTimer--;
  }
}

export function moveZombie(zombie, player, walls, speed, width, height) {
  const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);
  if (!zombie.triggered) {
    if (dist <= TRIGGER_DISTANCE && hasLineOfSight(zombie, player, walls, 10)) {
      zombie.triggered = true;
    } else {
      wanderZombie(zombie, walls, width, height);
      return;
    }
  }

  if (hasLineOfSight(zombie, player, walls, 10)) {
    moveTowards(zombie, player, speed);
    return;
  }

  const path = findPath(zombie, player, walls, width, height);
  if (path.length < 2) {
    // Fallback to direct movement when no path is found
    moveTowards(zombie, player, speed);
    return;
  }

  const [nx, ny] = path[1];
  const target = {
    x: nx * SEGMENT_SIZE + SEGMENT_SIZE / 2,
    y: ny * SEGMENT_SIZE + SEGMENT_SIZE / 2,
  };
  moveTowards(zombie, target, speed);
}
