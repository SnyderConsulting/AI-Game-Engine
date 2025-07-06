import test from "node:test";
import assert from "node:assert/strict";
import { dropLoot } from "../src/loot.js";

// helper to mock Math.random with sequence
function withRandomValues(values, fn) {
  const orig = Math.random;
  let i = 0;
  Math.random = () => values[i++] ?? 1;
  try {
    return fn();
  } finally {
    Math.random = orig;
  }
}

test("dropLoot gives fire core for fire zombie", () => {
  const world = [];
  withRandomValues([0.5, 1, 1, 1], () => {
    dropLoot({ x: 0, y: 0, variant: "fire" }, world);
  });
  assert.strictEqual(
    world.some((it) => it.type === "fire_core"),
    true,
  );
});

test("dropLoot does not give fire core for normal zombie", () => {
  const world = [];
  withRandomValues([0.5, 1, 1, 1], () => {
    dropLoot({ x: 0, y: 0, variant: "normal" }, world);
  });
  assert.strictEqual(
    world.some((it) => it.type === "fire_core"),
    false,
  );
});
