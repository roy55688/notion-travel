import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTripDate,
  getTicketStatusLabel,
  getTicketStatusTone
} from "./tripDisplay.js";

test("票券狀態使用三種不同色系並為缺值提供預設樣式", () => {
  assert.equal(getTicketStatusTone("已預定"), "reserved");
  assert.equal(getTicketStatusTone("未預定"), "not-reserved");
  assert.equal(getTicketStatusTone("現場排隊"), "walk-in");
  assert.equal(getTicketStatusTone(""), "unset");
  assert.equal(getTicketStatusLabel(""), "未設定");
});

test("無效或缺少日期時顯示未分類", () => {
  assert.equal(formatTripDate(""), "未分類");
  assert.equal(formatTripDate("not-a-date"), "未分類");
});
