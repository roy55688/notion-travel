function getPlainText(richText = []) {
  return richText.map(t => t.plain_text || "").join("");
}

function convertBlock(block) {
  if (block.type === "paragraph") {
    return {
      type: "paragraph",
      text: getPlainText(block.paragraph?.rich_text)
    };
  }

  if (block.type === "image") {
    const image = block.image;

    return {
      type: "image",
      url: image.type === "external"
        ? image.external?.url
        : image.file?.url,
      caption: getPlainText(image.caption)
    };
  }

  return {
    type: block.type
  };
}

function normalizeNotionId(value = "") {
  return value.replaceAll("-", "").toLowerCase();
}

function errorResponse(statusCode, error) {
  return {
    statusCode,
    headers: { "Cache-Control": "no-store" },
    body: JSON.stringify({ error })
  };
}

export async function handler(event) {
  const pageId = normalizeNotionId(event.queryStringParameters?.id);
  const databaseId = normalizeNotionId(process.env.NOTION_DATABASE_ID);
  const token = process.env.NOTION_TOKEN;

  if (!/^[0-9a-f]{32}$/.test(pageId)) {
    return errorResponse(400, "無效的行程 ID");
  }

  if (!databaseId || !token) {
    return errorResponse(500, "行程內容尚未設定");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2022-06-28"
  };

  const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers
  });

  if (!pageResponse.ok) {
    return errorResponse(404, "找不到行程內容");
  }

  const page = await pageResponse.json();

  if (normalizeNotionId(page?.parent?.database_id) !== databaseId) {
    return errorResponse(404, "找不到行程內容");
  }

  const response = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    {
      method: "GET",
      headers
    }
  );

  if (!response.ok) {
    return errorResponse(502, "行程內容載入失敗");
  }

  const data = await response.json();

  const content = data.results
    .map(convertBlock)
    .filter(block => {
      if (block.type === "paragraph") return block.text;
      if (block.type === "image") return block.url;
      return false;
    });

  return {
    statusCode: 200,
    headers: {
      "Netlify-CDN-Cache-Control": "public, durable, max-age=300, stale-while-revalidate=60",
      "Netlify-Vary": "query=id|edited",
      "Cache-Control": "public, max-age=0, must-revalidate"
    },
    body: JSON.stringify({
      pageId,
      content
    })
  };
}
