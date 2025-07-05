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

export function spawnZombie(width, height) {
  return createZombie(Math.random() * width, Math.random() * height);
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
