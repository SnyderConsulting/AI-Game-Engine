import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, tryPhoenixRevival } from "../src/player.js";
import { PLAYER_MAX_HEALTH } from "../src/game_logic.js";

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
