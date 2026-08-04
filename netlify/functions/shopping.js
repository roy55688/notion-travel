function getPlainText(richText) {
  if (!Array.isArray(richText)) return "";
  return richText.map(text => text?.plain_text || "").join("");
}

export function transformShoppingItem(item = {}) {
  const props = item?.properties ?? {};

  return {
    id: item?.id ?? "",
    lastEditedTime: item?.last_edited_time ?? "",
    name: getPlainText(props["名稱"]?.title) || "未命名商品",
    productType: getPlainText(props["商品類型"]?.rich_text),
    storeType: props["商店類型"]?.select?.name ?? "",
    store: getPlainText(props["購買商店"]?.rich_text),
    description: getPlainText(props["商品說明"]?.rich_text),
    shouldBuy: props["是否要買"]?.checkbox === true,
    purchased: props["已購買"]?.checkbox === true
  };
}

export function isPendingShoppingItem(item) {
  return item?.shouldBuy === true && item?.purchased === false;
}

export default async () => {
  try {
    const databaseId = Netlify.env.get("NOTION_SHOPPINGLIST_DATABASE_ID");
    const token = Netlify.env.get("NOTION_TOKEN");

    if (!databaseId || !token) {
      throw new Error("Notion 購物清單環境變數尚未設定");
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
    const items = results
      .map(transformShoppingItem)
      .filter(isPendingShoppingItem);

    return Response.json(items, {
      headers: {
        "Cache-Control": "no-store",
        "Netlify-CDN-Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Notion 購物清單載入失敗", error);

    return Response.json(
      { error: "購物清單資料載入失敗" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
};
