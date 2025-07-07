import test from "node:test";
import assert from "node:assert/strict";
import {
  upgradeFireball,
  upgradeFireOrb,
  upgradePhoenixRevival,
  SKILL_INFO,
} from "../src/skill_tree.js";
import { createPlayer, resetPlayerForNewGame } from "../src/player.js";
import { createInventory } from "../src/inventory.js";
import { PLAYER_MAX_HEALTH } from "../src/game_logic.js";
import { addItem, moveToHotbar } from "../src/inventory.js";

function setup(points = 2) {
  const player = createPlayer(PLAYER_MAX_HEALTH);
  const inv = createInventory();
  player.fireMutationPoints = points;
  return { player, inv };
}

test("upgradeFireball unlocks and adds item", () => {
  const { player, inv } = setup(2);
  const res = upgradeFireball(player, inv, addItem, moveToHotbar);
  assert.strictEqual(res, true);
  assert.strictEqual(player.fireMutationPoints, 0);
  assert.strictEqual(player.abilities.fireballLevel, 1);
  assert.strictEqual(inv.hotbar[0].item, "fireball_spell");
});

test("upgradeFireball upgrades levels with correct costs", () => {
  const { player, inv } = setup(7);
  // unlock
  assert(upgradeFireball(player, inv, addItem, moveToHotbar));
  assert.strictEqual(player.abilities.fireballLevel, 1);
  // level 2
  assert(upgradeFireball(player, inv, addItem, moveToHotbar));
  assert.strictEqual(player.abilities.fireballLevel, 2);
  // level 3
  assert(upgradeFireball(player, inv, addItem, moveToHotbar));
  assert.strictEqual(player.abilities.fireballLevel, 3);
  assert.strictEqual(player.fireMutationPoints, 0);
  // cannot exceed max
  assert.strictEqual(
    upgradeFireball(player, inv, addItem, moveToHotbar),
    false,
  );
});

test("upgradeFireOrb levels", () => {
  const { player } = setup(6);
  assert(upgradeFireOrb(player));
  assert.strictEqual(player.abilities.fireOrbLevel, 1);
  assert(upgradeFireOrb(player));
  assert.strictEqual(player.abilities.fireOrbLevel, 2);
  assert(upgradeFireOrb(player));
  assert.strictEqual(player.abilities.fireOrbLevel, 3);
  assert.strictEqual(player.fireMutationPoints, 0);
  assert.strictEqual(upgradeFireOrb(player), false);
});

test("upgradePhoenixRevival costs", () => {
  const { player } = setup(11);
  assert(upgradePhoenixRevival(player));
  assert.strictEqual(player.abilities.phoenixRevivalLevel, 1);
  assert(upgradePhoenixRevival(player));
  assert.strictEqual(player.abilities.phoenixRevivalLevel, 2);
  assert(upgradePhoenixRevival(player));
  assert.strictEqual(player.abilities.phoenixRevivalLevel, 3);
  assert.strictEqual(player.fireMutationPoints, 0);
});

test("skill info includes level details", () => {
  for (const info of SKILL_INFO) {
    assert(Array.isArray(info.levels));
    assert.strictEqual(info.levels.length, info.max);
    info.levels.forEach((lvl, i) => {
      assert.strictEqual(lvl.cost, info.costs[i + 1]);
      assert(typeof lvl.effect === "string");
    });
  }
});
