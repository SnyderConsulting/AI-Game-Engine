import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, resetPlayerForNewGame } from "../src/player.js";
import { PLAYER_MAX_HEALTH } from "../src/game_logic.js";

test("resetPlayerForNewGame clears abilities and restores health", () => {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  player.abilities.fireball = true;
  player.abilities.fireballLevel = 2;
  player.abilities.fireOrb = true;
  player.abilities.fireOrbLevel = 1;
  player.abilities.phoenixRevival = true;
  player.abilities.phoenixRevivalLevel = 2;
  player.health = 1;
  player.weapon = { type: "bat" };
  resetPlayerForNewGame(player, PLAYER_MAX_HEALTH);
  assert.strictEqual(player.abilities.fireball, false);
  assert.strictEqual(player.abilities.fireballLevel, 0);
  assert.strictEqual(player.abilities.fireOrb, false);
  assert.strictEqual(player.abilities.fireOrbLevel, 0);
  assert.strictEqual(player.abilities.phoenixRevival, false);
  assert.strictEqual(player.abilities.phoenixRevivalLevel, 0);
  assert.strictEqual(player.phoenixCooldown, 0);
  assert.strictEqual(player.damageBuffMult, 1);
  assert.strictEqual(player.health, PLAYER_MAX_HEALTH);
  assert.strictEqual(player.weapon, null);
});
