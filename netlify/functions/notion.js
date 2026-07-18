function getPlainText(richText) {
  if (!Array.isArray(richText)) return "";
  return richText.map(text => text?.plain_text || "").join("");
}

export function transformNotionItem(item = {}) {
  const props = item?.properties ?? {};

  return {
    id: item?.id ?? "",
    name: getPlainText(props.Name?.title) || "未命名行程",
    date: props.Time?.date?.start ?? "",
    tag: props["標籤"]?.select?.name ?? "",
    order: Number.isFinite(props.Order?.number) ? props.Order.number : 9999,
    mapUrl: props["google map連結"]?.url ?? "",
    ticketStatus: props["票券預定"]?.select?.name ?? "",
    reservationTime: getPlainText(props["預定時間"]?.rich_text)
  };
}

export default async () => {
  try {
    const databaseId = Netlify.env.get("NOTION_DATABASE_ID");
    const token = Netlify.env.get("NOTION_TOKEN");

    if (!databaseId || !token) {
      throw new Error("Notion 環境變數尚未設定");
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API 回傳 ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    return Response.json(results.map(transformNotionItem));
  } catch (error) {
    console.error("Notion 行程載入失敗", error);

    return Response.json(
      { error: "行程資料載入失敗" },
      { status: 500 }
    );
  }
};
