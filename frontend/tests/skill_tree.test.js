import test from "node:test";
import assert from "node:assert/strict";
import { unlockFireball } from "../src/skill_tree.js";
import { createPlayer } from "../src/player.js";
import { createInventory } from "../src/inventory.js";
import { PLAYER_MAX_HEALTH } from "../src/game_logic.js";
import { addItem, moveToHotbar } from "../src/inventory.js";

// simple helper to mimic unlock sequence
function setup() {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  const inv = createInventory();
  player.fireMutationPoints = 2;
  return { player, inv };
}

test("unlockFireball consumes points and adds item", () => {
  const { player, inv } = setup();
  const res = unlockFireball(player, inv, addItem, moveToHotbar);
  assert.strictEqual(res, true);
  assert.strictEqual(player.fireMutationPoints, 0);
  assert.strictEqual(player.abilities.fireball, true);
  assert.strictEqual(inv.hotbar[0].item, "fireball_spell");
});
