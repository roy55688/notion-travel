import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTripDate,
  getInitialTripDate,
  getTicketStatusTone
} from "./tripDisplay.js";

test("票券狀態使用三種不同色系", () => {
  assert.equal(getTicketStatusTone("已預定"), "reserved");
  assert.equal(getTicketStatusTone("未預定"), "not-reserved");
  assert.equal(getTicketStatusTone("現場排隊"), "walk-in");
});

test("無效或缺少日期時顯示未分類", () => {
  assert.equal(formatTripDate(""), "未分類");
  assert.equal(formatTripDate("not-a-date"), "未分類");
});

test("依網址日期、今天、第一天的順序選擇初始行程", () => {
  const dates = ["2026-09-08", "2026-09-09"];

  assert.equal(getInitialTripDate(dates, "/2026-09-09", "2026-09-08"), "2026-09-09");
  assert.equal(getInitialTripDate(dates, "/", "2026-09-09"), "2026-09-09");
  assert.equal(getInitialTripDate(dates, "/2026-09-10", "2026-09-09"), "2026-09-08");
  assert.equal(getInitialTripDate(dates, "/", "2026-09-10"), "2026-09-08");
});
