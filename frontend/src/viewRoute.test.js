import assert from "node:assert/strict";
import test from "node:test";
import { getView } from "./viewRoute.js";

test("購物清單路徑不會和日期路徑衝突", () => {
  assert.equal(getView("/shopping"), "shopping");
  assert.equal(getView("/shopping/"), "shopping");
  assert.equal(getView("/2026-09-06"), "trips");
  assert.equal(getView("/"), "trips");
});
