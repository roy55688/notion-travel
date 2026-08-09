import assert from "node:assert/strict";
import test from "node:test";
import shoppingHandler, {
  isPendingShoppingItem,
  transformShoppingItem
} from "../functions/shopping.js";

test("轉換購物清單的完整欄位", () => {
  const item = transformShoppingItem({
    id: "shopping-id",
    last_edited_time: "2026-08-04T03:51:00.000Z",
    properties: {
      名稱: { title: [{ plain_text: "封口夾" }] },
      商品類型: { rich_text: [{ plain_text: "試用包" }, { plain_text: "封口夾" }] },
      商店類型: { select: { name: "日常用品" } },
      購買商店: { rich_text: [{ plain_text: "Seria" }] },
      商品說明: { rich_text: [{ plain_text: "避免內容物外漏" }] },
      是否要買: { checkbox: true },
      已購買: { checkbox: false }
    }
  });

  assert.deepEqual(item, {
    id: "shopping-id",
    lastEditedTime: "2026-08-04T03:51:00.000Z",
    name: "封口夾",
    productType: "試用包封口夾",
    storeType: "日常用品",
    store: "Seria",
    description: "避免內容物外漏",
    shouldBuy: true,
    purchased: false
  });
  assert.equal(isPendingShoppingItem(item), true);
});

test("只保留要買且尚未購買的商品", () => {
  assert.equal(isPendingShoppingItem({ shouldBuy: true, purchased: false }), true);
  assert.equal(isPendingShoppingItem({ shouldBuy: false, purchased: false }), false);
  assert.equal(isPendingShoppingItem({ shouldBuy: true, purchased: true }), false);
});

test("缺少購物清單屬性時提供安全預設值", () => {
  assert.deepEqual(transformShoppingItem(), {
    id: "",
    lastEditedTime: "",
    name: "未命名商品",
    productType: "",
    storeType: "",
    store: "",
    description: "",
    shouldBuy: false,
    purchased: false
  });
});

test("未設定購買清單資料庫時回傳尚未啟用", async () => {
  globalThis.Netlify = {
    env: {
      get: name => name === "NOTION_TOKEN" ? "test-token" : ""
    }
  };

  try {
    const response = await shoppingHandler();
    assert.equal(response.status, 204);
  } finally {
    delete globalThis.Netlify;
  }
});
