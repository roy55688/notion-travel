import assert from "node:assert/strict";
import test from "node:test";
import { handler } from "../functions/page.js";

test("拒絕讀取行程資料庫以外的 Notion 頁面", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.NOTION_TOKEN;
  const originalDatabaseId = process.env.NOTION_DATABASE_ID;
  const requests = [];

  process.env.NOTION_TOKEN = "test-token";
  process.env.NOTION_DATABASE_ID = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  globalThis.fetch = async url => {
    requests.push(url);
    return Response.json({
      parent: { database_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" }
    });
  };

  try {
    const response = await handler({
      queryStringParameters: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }
    });

    assert.equal(response.statusCode, 404);
    assert.equal(requests.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.NOTION_TOKEN;
    else process.env.NOTION_TOKEN = originalToken;
    if (originalDatabaseId === undefined) delete process.env.NOTION_DATABASE_ID;
    else process.env.NOTION_DATABASE_ID = originalDatabaseId;
  }
});
