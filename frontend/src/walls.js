import { SEGMENT_SIZE } from "./game_logic.js";

export const WALL_MATERIALS = {
  // Lowered health so melee weapons can visibly damage shelves
  steel: { hp: 30, img: "assets/shelf_metal.png" },
  wood: { hp: 20, img: "assets/shelf_wood.png" },
  plastic: { hp: 10, img: "assets/shelf_plastic.png" },
};

export const WALL_IMAGES = {};
if (typeof Image !== "undefined") {
  for (const [mat, data] of Object.entries(WALL_MATERIALS)) {
    const img = new Image();
    img.src = data.img;
    WALL_IMAGES[mat] = img;
  }
}

export function createWall(gx, gy, material = "wood") {
  const hp = WALL_MATERIALS[material].hp;
  return {
    x: gx * SEGMENT_SIZE,
    y: gy * SEGMENT_SIZE,
    size: SEGMENT_SIZE,
    material,
    hp,
    maxHp: hp,
    damageTimer: 0,
  };
}

function randMaterial() {
  const keys = Object.keys(WALL_MATERIALS);
  return keys[Math.floor(Math.random() * keys.length)];
}

export function generateStoreWalls(width, height) {
  const walls = [];
  const gridW = Math.floor(width / SEGMENT_SIZE);
  const gridH = Math.floor(height / SEGMENT_SIZE);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const addVertical = (gx, gy1, gy2) => {
    gx = clamp(gx, 0, gridW - 1);
    gy1 = clamp(gy1, 0, gridH - 1);
    gy2 = clamp(gy2, 0, gridH - 1);
    for (let y = gy1; y <= gy2; y++) {
      walls.push(createWall(gx, y, randMaterial()));
    }
  };
  const addHorizontal = (gy, gx1, gx2) => {
    gy = clamp(gy, 0, gridH - 1);
    gx1 = clamp(gx1, 0, gridW - 1);
    gx2 = clamp(gx2, 0, gridW - 1);
    for (let x = gx1; x <= gx2; x++) {
      walls.push(createWall(x, gy, randMaterial()));
    }
  };

  const addRoom = (x, y, w, h) => {
    for (let gx = x; gx < x + w; gx++) {
      for (let gy = y; gy < y + h; gy++) {
        if (gx === x + Math.floor(w / 2) && gy === y + h - 1) {
          continue; // entrance
        }
        if (gx === x || gx === x + w - 1 || gy === y || gy === y + h - 1) {
          walls.push(createWall(gx, gy, randMaterial()));
        }
      }
    }
  };

  // vertical aisle positions spaced widely
  const vSpacing = Math.max(6, Math.floor(gridW / 4));
  const vPositions = [];
  for (let gx = 2; gx < gridW - 2; gx += vSpacing) {
    vPositions.push(gx);
    let y = 2;
    while (y < gridH - 4) {
      const len = 4 + Math.floor(Math.random() * 3); // 4-6 segments
      addVertical(gx, y, Math.min(y + len - 1, gridH - 4));
      y += len + 3 + Math.floor(Math.random() * 2); // gap 3-4
    }
  }

  // horizontal aisles with generous gaps
  const hSpacing = Math.max(8, Math.floor(gridH / 5));
  for (let gy = 4; gy < gridH - 3; gy += hSpacing) {
    let x = 2;
    while (x < gridW - 4) {
      const len = 4 + Math.floor(Math.random() * 3);
      addHorizontal(gy, x, Math.min(x + len - 1, gridW - 4));
      x += len + 4 + Math.floor(Math.random() * 3); // gap 4-6
    }
  }

  // occasional U-shaped sections
  vPositions.forEach((gx) => {
    if (Math.random() < 0.4) {
      const y = 2 + Math.floor(Math.random() * Math.max(1, gridH - 8));
      addHorizontal(y, gx - 1, gx + 1);
      addHorizontal(y + 1, gx - 1, gx + 1);
    }
  });

  // one or two enclosed rooms
  const roomCount = 1 + Math.floor(Math.random() * 2);
  for (let r = 0; r < roomCount; r++) {
    const rw = Math.min(3 + Math.floor(Math.random() * 3), gridW - 2);
    const rh = Math.min(3 + Math.floor(Math.random() * 3), gridH - 2);
    if (rw < 3 || rh < 3) continue;
    const startX = 1 + Math.floor(Math.random() * (gridW - rw - 1));
    const startY = 1 + Math.floor(Math.random() * (gridH - rh - 1));
    addRoom(startX, startY, rw, rh);
  }

  return walls;
}

export function damageWall(wall, dmg) {
  wall.hp -= dmg;
  wall.damageTimer = 5;
  return wall.hp <= 0;
}

export function wallSwingHit(
  player,
  wall,
  range,
  direction,
  arc = Math.PI / 2,
) {
  const len = Math.hypot(direction.x, direction.y);
  if (len === 0) return false;
  const dirNorm = { x: direction.x / len, y: direction.y / len };
  const cosHalf = Math.cos(arc / 2);
  const closestX = Math.max(wall.x, Math.min(player.x, wall.x + wall.size));
  const closestY = Math.max(wall.y, Math.min(player.y, wall.y + wall.size));
  const wx = closestX - player.x;
  const wy = closestY - player.y;
  const dist = Math.hypot(wx, wy);
  return dist <= range && wx * dirNorm.x + wy * dirNorm.y >= cosHalf * dist;
}

export function updateWalls(walls) {
  for (let i = walls.length - 1; i >= 0; i--) {
    const w = walls[i];
    if (w.damageTimer > 0) w.damageTimer--;
    if (w.hp <= 0) walls.splice(i, 1);
  }
}
