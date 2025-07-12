import test from "node:test";
import assert from "node:assert/strict";
import { loadImages } from "../src/utils/assets.js";

test("loadImages returns objects keyed by input", () => {
  const imgs = loadImages({ a: "one.png", b: "two.png" });
  assert.deepStrictEqual(Object.keys(imgs), ["a", "b"]);
  assert.strictEqual(imgs.a.src, "one.png");
});
