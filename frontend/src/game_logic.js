import { moveTowards, isColliding } from "./utils/geometry.js";
import { circleRectColliding } from "./systems/collision-system.js";

export function spawnPlayer(width, height, walls = []) {
  let player;
  let attempts = 0;
  do {
    player = { x: Math.random() * width, y: Math.random() * height };
    attempts++;
  } while (
    attempts < 20 &&
    walls.some((w) => circleRectColliding(player, w, 10))
  );
  return player;
}

export function randomOpenPosition(width, height, walls = []) {
  let p;
  let attempts = 0;
  do {
    p = { x: Math.random() * width, y: Math.random() * height };
    attempts++;
  } while (attempts < 20 && walls.some((w) => circleRectColliding(p, w, 10)));
  return p;
}

export function createContainer(x, y) {
  return { x, y, opened: false, item: null, type: "cardboard_box" };
}

export const CONTAINER_LOOT = ["scrap_metal", "duct_tape", "nails", "medkit"];

export function openContainer(container) {
  if (!container.opened) {
    container.opened = true;
    const idx = Math.floor(Math.random() * CONTAINER_LOOT.length);
    container.item = CONTAINER_LOOT[idx];
  }
  return container.item;
}

export function spawnContainers(width, height, walls = [], count = 3) {
  const containers = [];
  for (let i = 0; i < count; i++) {
    const pos = randomOpenPosition(width, height, walls);
    containers.push(createContainer(pos.x, pos.y));
  }
  return containers;
}

export function createSpawnDoor(width, height, walls = []) {
  let door;
  let inside;
  do {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      door = { x: Math.random() * width, y: 0 };
      inside = { x: door.x, y: SEGMENT_SIZE };
    } else if (edge === 1) {
      door = { x: Math.random() * width, y: height };
      inside = { x: door.x, y: height - SEGMENT_SIZE };
    } else if (edge === 2) {
      door = { x: 0, y: Math.random() * height };
      inside = { x: SEGMENT_SIZE, y: door.y };
    } else {
      door = { x: width, y: Math.random() * height };
      inside = { x: width - SEGMENT_SIZE, y: door.y };
    }
  } while (
    walls.some((w) => circleRectColliding(door, w, 10)) ||
    walls.some((w) => circleRectColliding(inside, w, 10))
  );
  return door;
}

export const PLAYER_MAX_HEALTH = 10;

export const SEGMENT_SIZE = 40;
