import test from "node:test";
import assert from "node:assert/strict";
import {
  createZombie,
  moveTowards,
  isColliding,
  circleRectColliding,
  SEGMENT_SIZE,
  TRIGGER_DISTANCE,
  spawnZombie,
  spawnPlayer,
  findPath,
  hasLineOfSight,
  moveZombie,
  attackZombies,
  attackZombiesWithKills,
  ZOMBIE_MAX_HEALTH,
  spawnZombieAtDoor,
  createContainer,
  spawnContainers,
} from "../src/game_logic.js";
import { generateStoreWalls } from "../src/walls.js";

test("moveTowards moves entity toward target", () => {
  const zombie = { x: 0, y: 0 };
  const player = { x: 3, y: 4 }; // distance 5
  moveTowards(zombie, player, 1);
  assert(Math.abs(zombie.x - 0.6) < 1e-6);
  assert(Math.abs(zombie.y - 0.8) < 1e-6);
});

test("isColliding detects overlap", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 5, y: 0 };
  assert.strictEqual(isColliding(a, b, 3), true);
  const c = { x: 7, y: 0 };
  assert.strictEqual(isColliding(a, c, 3), false);
});

test("generateStoreWalls creates segments within bounds", () => {
  const walls = generateStoreWalls(200, 200);
  assert(walls.length > 0);
  walls.forEach((w) => {
    assert(w.x >= 0 && w.x + w.size <= 200);
    assert(w.y >= 0 && w.y + w.size <= 200);
    assert.strictEqual(w.size, SEGMENT_SIZE);
  });
});

test("circleRectColliding detects intersection", () => {
  const rect = { x: 40, y: 40, size: SEGMENT_SIZE };
  const circle = { x: 50, y: 50 };
  assert.strictEqual(circleRectColliding(circle, rect, 10), true);
  const far = { x: 10, y: 10 };
  assert.strictEqual(circleRectColliding(far, rect, 10), false);
});

test("spawnZombie avoids walls", () => {
  const wall = { x: 40, y: 40, size: SEGMENT_SIZE };
  for (let i = 0; i < 20; i++) {
    const z = spawnZombie(80, 80, [wall]);
    assert.strictEqual(circleRectColliding(z, wall, 10), false);
  }
});

test("spawnPlayer avoids walls", () => {
  const wall = { x: 40, y: 40, size: SEGMENT_SIZE };
  for (let i = 0; i < 20; i++) {
    const p = spawnPlayer(80, 80, [wall]);
    assert.strictEqual(circleRectColliding(p, wall, 10), false);
  }
});

test("findPath navigates around walls", () => {
  const walls = [{ x: 40, y: 0, size: SEGMENT_SIZE }];
  const start = { x: 10, y: 10 };
  const end = { x: 90, y: 50 };
  const path = findPath(start, end, walls, 120, 80);
  assert(path.length > 0);
  const blocked = new Set(
    walls.map((w) => `${w.x / SEGMENT_SIZE},${w.y / SEGMENT_SIZE}`),
  );
  path.forEach((c) => {
    assert.strictEqual(blocked.has(`${c[0]},${c[1]}`), false);
  });
});

test("findPath treats zombies as blocked spaces", () => {
  const start = { x: 10, y: 10 };
  const end = { x: 90, y: 10 };
  const zombieBlock = { x: 50, y: 10 };
  const path = findPath(start, end, [], 120, 80, [zombieBlock]);
  assert(path.length > 0);
  const blockedCell = `${Math.floor(zombieBlock.x / SEGMENT_SIZE)},${Math.floor(zombieBlock.y / SEGMENT_SIZE)}`;
  const cells = path.map((c) => `${c[0]},${c[1]}`);
  assert.strictEqual(cells.includes(blockedCell), false);
});

test("hasLineOfSight detects blockage", () => {
  const wall = { x: 40, y: 0, size: SEGMENT_SIZE };
  const start = { x: 10, y: 10 };
  const end = { x: 90, y: 10 };
  assert.strictEqual(hasLineOfSight(start, end, [wall], 10), false);
  assert.strictEqual(hasLineOfSight(start, end, [], 10), true);
});

test("zombie triggers when player is near and visible", () => {
  const zombie = createZombie(0, 0);
  const player = { x: TRIGGER_DISTANCE - 10, y: 0 };
  moveZombie(zombie, player, [], 1, 100, 100);
  assert.strictEqual(zombie.triggered, true);
  assert(zombie.x > 0);
});

test("zombie wanders slowly when player is far", () => {
  const zombie = createZombie(20, 20);
  const player = { x: 95, y: 20 };
  moveZombie(zombie, player, [], 1, 100, 100);
  assert.strictEqual(zombie.triggered, false);
  const dist = Math.hypot(zombie.x - 20, zombie.y - 20);
  assert(dist > 0 && dist <= 0.3);
});

test("spawnZombieAtDoor spawns at door location", () => {
  const door = { x: 0, y: 50 };
  const z = spawnZombieAtDoor(door);
  assert.strictEqual(z.x, door.x);
  assert.strictEqual(z.y, door.y);
});

test("spawnZombieAtDoor uses random chance for fire variant", () => {
  const door = { x: 10, y: 10 };
  const originalRandom = Math.random;
  Math.random = () => 0.1; // below threshold
  const fire = spawnZombieAtDoor(door);
  Math.random = () => 0.9; // above threshold
  const normal = spawnZombieAtDoor(door);
  Math.random = originalRandom;
  assert.strictEqual(fire.variant, "fire");
  assert.strictEqual(normal.variant, "normal");
});

test("moveZombie goes straight when unobstructed", () => {
  const zombie = createZombie(0, 0);
  zombie.triggered = true;
  const player = { x: 30, y: 0 };
  moveZombie(zombie, player, [], 1, 100, 100);
  assert(Math.abs(zombie.x - 1) < 1e-6);
  assert(Math.abs(zombie.y) < 1e-6);
});

test("moveZombie follows grid path when blocked", () => {
  const zombie = createZombie(20, 20);
  zombie.triggered = true;
  const player = { x: 80, y: 10 };
  const wall = { x: 40, y: 0, size: SEGMENT_SIZE };
  moveZombie(zombie, player, [wall], 1, 120, 80);
  // First path step keeps x ~20 but increases y toward open space
  assert(Math.abs(zombie.x - 20) < 1e-6);
  assert(zombie.y > 20);
});

test("moveZombie avoids occupied tiles", () => {
  const zombieA = createZombie(10, 10);
  zombieA.triggered = true;
  const zombieB = createZombie(50, 10);
  const player = { x: 90, y: 10 };
  for (let i = 0; i < 50; i++) {
    moveZombie(zombieA, player, [], 1, 120, 80, [zombieA, zombieB]);
  }
  assert.strictEqual(isColliding(zombieA, zombieB, 10), false);
});

test("attackZombies damages and removes zombies", () => {
  const player = { x: 0, y: 0 };
  const dir = { x: 1, y: 0 };
  const zombies = [{ x: 5, y: 0, health: ZOMBIE_MAX_HEALTH }];
  attackZombies(player, zombies, 1, 10, dir, Math.PI / 2, 0);
  assert.strictEqual(zombies[0].health, ZOMBIE_MAX_HEALTH - 1);
  attackZombies(player, zombies, 1, 10, dir, Math.PI / 2, 0);
  assert.strictEqual(zombies.length, 0);
});

test("attackZombies ignores zombies outside the swing arc", () => {
  const player = { x: 0, y: 0 };
  const dir = { x: 1, y: 0 };
  const zombies = [
    { x: 5, y: 0, health: 1 },
    { x: -5, y: 0, health: 1 },
  ];
  attackZombies(player, zombies, 1, 10, dir, Math.PI / 2, 0);
  assert.strictEqual(zombies.length, 1);
  assert.strictEqual(zombies[0].x < 0, true);
});

test("attackZombies applies knockback", () => {
  const player = { x: 0, y: 0 };
  const dir = { x: 1, y: 0 };
  const zombies = [{ x: 10, y: 0, health: 2 }];
  attackZombies(player, zombies, 1, 15, dir, Math.PI / 2, 5);
  assert(zombies[0].x > 10);
  assert.strictEqual(zombies[0].health, 1);
});

test("attackZombiesWithKills returns dead zombies", () => {
  const player = { x: 0, y: 0 };
  const dir = { x: 1, y: 0 };
  const zombies = [
    { x: 5, y: 0, health: 1 },
    { x: -5, y: 0, health: 2 },
  ];
  const killed = attackZombiesWithKills(
    player,
    zombies,
    1,
    10,
    dir,
    Math.PI,
    0,
  );
  assert.strictEqual(killed.length, 1);
  assert.strictEqual(zombies.length, 1);
});

test("spawnContainers places non-colliding containers", () => {
  const walls = [{ x: 40, y: 40, size: SEGMENT_SIZE }];
  const containers = spawnContainers(80, 80, walls, 3);
  assert.strictEqual(containers.length, 3);
  containers.forEach((c) => {
    assert.strictEqual(circleRectColliding(c, walls[0], 10), false);
    assert.strictEqual(c.type, "cardboard_box");
  });
});

test("moveZombie does not move through walls when path fails", () => {
  const wall = { x: 40, y: 40, size: SEGMENT_SIZE };
  const zombie = createZombie(30, 60);
  zombie.triggered = true;
  // Player is inside the wall so no path exists
  const player = { x: 60, y: 60 };
  moveZombie(zombie, player, [wall], 1, 120, 120);
  assert.strictEqual(circleRectColliding(zombie, wall, 10), false);
});
