import test from "node:test";
import assert from "node:assert/strict";
import { getItemCooldown } from "../src/cooldowns.js";

test("getItemCooldown handles fireball", () => {
  const res = getItemCooldown("fireball_spell", { swingTimer: 0 }, 7);
  assert.deepEqual(res, { remaining: 7, max: 15 });
});

test("getItemCooldown handles baseball bat", () => {
  const res = getItemCooldown("baseball_bat", { swingTimer: 3 }, 0);
  assert.deepEqual(res, { remaining: 3, max: 10 });
});

test("getItemCooldown unknown item", () => {
  const res = getItemCooldown("foo", { swingTimer: 2 }, 1);
  assert.deepEqual(res, { remaining: 0, max: 0 });
});
