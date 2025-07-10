import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayer,
  tryPhoenixRevival,
  PHOENIX_KNOCKBACK_FORCE,
} from "../src/entities/player.js";
import { PLAYER_MAX_HEALTH, createZombie } from "../src/game_logic.js";

test("tryPhoenixRevival revives player", () => {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  player.abilities.phoenixRevival = true;
  player.abilities.phoenixRevivalLevel = 1;
  player.phoenixCooldown = 0;
  player.health = 0;
  const res = tryPhoenixRevival(player, PLAYER_MAX_HEALTH);
  assert.strictEqual(res, true);
  assert.strictEqual(player.health, 1);
  assert.strictEqual(player.phoenixCooldown, 7200);
  assert.strictEqual(player.damageBuffMult, 1.25);
  assert.strictEqual(player.damageBuffTimer, 300);
});

test("tryPhoenixRevival knocks back nearby zombies", () => {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  player.abilities.phoenixRevival = true;
  player.abilities.phoenixRevivalLevel = 1;
  player.phoenixCooldown = 0;
  player.health = 0;
  player.x = 0;
  player.y = 0;
  const zombie = createZombie(10, 0);
  const res = tryPhoenixRevival(player, PLAYER_MAX_HEALTH, [zombie]);
  assert.strictEqual(res, true);
  assert(zombie.x >= 10 + PHOENIX_KNOCKBACK_FORCE);
});

test("tryPhoenixRevival fails when on cooldown", () => {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  player.abilities.phoenixRevival = true;
  player.abilities.phoenixRevivalLevel = 1;
  player.phoenixCooldown = 10;
  player.health = 0;
  const res = tryPhoenixRevival(player, PLAYER_MAX_HEALTH);
  assert.strictEqual(res, false);
  assert.strictEqual(player.health, 0);
});
