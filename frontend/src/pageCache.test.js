import assert from "node:assert/strict";
import test from "node:test";
import { cachePage, getCachedPage, PAGE_CACHE_TTL } from "./pageCache.js";

test("筆記快取會重用內容並在 45 分鐘後失效", () => {
  const content = [{ type: "paragraph", text: "行程筆記" }];

  cachePage("trip", content, 1000);

  assert.equal(getCachedPage("trip", 1001), content);
  assert.equal(getCachedPage("trip", 1000 + PAGE_CACHE_TTL), null);
});
