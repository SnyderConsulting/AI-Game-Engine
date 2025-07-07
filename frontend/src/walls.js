import { SEGMENT_SIZE } from "./game_logic.js";

export const WALL_MATERIALS = {
  steel: { hp: 300, img: "assets/shelf_metal.png" },
  wood: { hp: 150, img: "assets/shelf_wood.png" },
  plastic: { hp: 75, img: "assets/shelf_plastic.png" },
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

  const addVertical = (gx, gy1, gy2) => {
    for (let y = gy1; y <= gy2; y++) {
      walls.push(createWall(gx, y, randMaterial()));
    }
  };
  const addHorizontal = (gy, gx1, gx2) => {
    for (let x = gx1; x <= gx2; x++) {
      walls.push(createWall(x, gy, randMaterial()));
    }
  };

  // primary vertical aisles
  const spacing = 4;
  for (let gx = 2; gx < gridW - 1; gx += spacing) {
    addVertical(gx, 1, gridH - 2);
  }

  // secondary horizontal aisles
  for (let gy = 3; gy < gridH - 1; gy += 6) {
    addHorizontal(gy, 1, gridW - 2);
  }

  // u-shaped sections at top of vertical aisles
  for (let gx = 2; gx < gridW - 1; gx += spacing) {
    if (Math.random() < 0.5) {
      addHorizontal(1, gx - 1, gx + 1);
      addHorizontal(2, gx - 1, gx + 1);
    }
  }

  // simple enclosed room in bottom-right
  const roomW = 4;
  const roomH = 4;
  const startX = Math.max(1, gridW - roomW - 2);
  const startY = Math.max(1, gridH - roomH - 2);
  for (let x = startX; x < Math.min(gridW - 1, startX + roomW); x++) {
    for (let y = startY; y < Math.min(gridH - 1, startY + roomH); y++) {
      if (y === startY + roomH - 1 && x === startX + Math.floor(roomW / 2))
        continue;
      walls.push(createWall(x, y, randMaterial()));
    }
  }

  return walls;
}

export function damageWall(wall, dmg) {
  wall.hp -= dmg;
  wall.damageTimer = 5;
}

export function updateWalls(walls) {
  for (let i = walls.length - 1; i >= 0; i--) {
    const w = walls[i];
    if (w.damageTimer > 0) w.damageTimer--;
    if (w.hp <= 0) walls.splice(i, 1);
  }
}
