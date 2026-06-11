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

export async function handler(event) {
  const pageId = event.queryStringParameters.id;

  const response = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28"
      }
    }
  );

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
    body: JSON.stringify({
      pageId,
      content
    })
  };
}