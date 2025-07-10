import test from "node:test";
import assert from "node:assert/strict";
import { createOrbs, updateOrbs } from "../src/entities/orbs.js";

// stub for collision
import { isColliding } from "../src/game_logic.js";

// orbs.update uses isColliding; but we don't need to stub because function import uses real isColliding

test("updateOrbs damages zombies and sets cooldown", () => {
  const orbs = createOrbs(1);
  const player = { x: 0, y: 0 };
  const zombies = [{ x: 25, y: 0, health: 2 }];
  updateOrbs(orbs, player, zombies, 1);
  assert(orbs[0].cooldown > 0);
  assert(zombies.length === 0 || zombies[0].health < 2);
});
