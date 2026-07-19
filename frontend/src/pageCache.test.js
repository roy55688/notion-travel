import assert from "node:assert/strict";
import test from "node:test";
import { cachePage, getCachedPage, PAGE_CACHE_TTL } from "./pageCache.js";

test("筆記快取會重用內容並在 45 分鐘後失效", () => {
  const content = [{ type: "paragraph", text: "行程筆記" }];

  cachePage("trip", content, "2026-07-19T09:05:00.000Z", 1000);

  assert.equal(getCachedPage("trip", "2026-07-19T09:05:00.000Z", 1001), content);
  assert.equal(getCachedPage("trip", "2026-07-19T09:12:00.000Z", 1001), null);

  cachePage("trip", content, "2026-07-19T09:12:00.000Z", 1000);
  assert.equal(
    getCachedPage("trip", "2026-07-19T09:12:00.000Z", 1000 + PAGE_CACHE_TTL),
    null
  );
});
