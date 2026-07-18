import assert from "node:assert/strict";
import test from "node:test";
import { transformNotionItem } from "../functions/notion.js";

test("轉換票券狀態與完整預定時間文字", () => {
  const item = transformNotionItem({
    id: "trip-id",
    properties: {
      Name: { title: [{ plain_text: "景點" }] },
      Time: { date: { start: "2026-09-06" } },
      Order: { number: 100 },
      標籤: { select: { name: "景點" } },
      "google map連結": { url: "https://maps.example/trip" },
      票券預定: { select: { name: "已預定" } },
      預定時間: {
        rich_text: [{ plain_text: "19" }, { plain_text: ":00" }]
      }
    }
  });

  assert.equal(item.ticketStatus, "已預定");
  assert.equal(item.reservationTime, "19:00");
});

test("缺少 Notion 屬性時提供安全預設值", () => {
  assert.deepEqual(transformNotionItem(), {
    id: "",
    name: "未命名行程",
    date: "",
    tag: "",
    order: 9999,
    mapUrl: "",
    ticketStatus: "",
    reservationTime: ""
  });
});
