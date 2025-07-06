import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, resetPlayerForNewGame } from "../src/player.js";
import { PLAYER_MAX_HEALTH } from "../src/game_logic.js";

test("resetPlayerForNewGame clears abilities and restores health", () => {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  player.abilities.fireball = true;
  player.abilities.fireballLevel = 2;
  player.health = 1;
  player.weapon = { type: "bat" };
  resetPlayerForNewGame(player, PLAYER_MAX_HEALTH);
  assert.strictEqual(player.abilities.fireball, false);
  assert.strictEqual(player.abilities.fireballLevel, 0);
  assert.strictEqual(player.health, PLAYER_MAX_HEALTH);
  assert.strictEqual(player.weapon, null);
});
