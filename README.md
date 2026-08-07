# Notion Travel

將 Notion 中的旅行行程與購物清單，透過 React、Vite 與 Netlify Functions 顯示成適合手機瀏覽的網站。

## 準備項目

- Node.js 20.19 以上或 22.12 以上
- Netlify 帳號
- Notion Integration Token
- 一個行程資料庫與一個購物清單資料庫，並將兩個資料庫分享給該 Notion Integration

## 環境變數

複製範例檔：

```powershell
Copy-Item .env.example .env
```

填入以下內容：

```dotenv
NOTION_TOKEN=你的_Notion_Integration_Token
NOTION_DATABASE_ID=行程資料庫_ID
NOTION_SHOPPINGLIST_DATABASE_ID=購物清單資料庫_ID
```

請勿提交 `.env` 或真實 Token。

## Notion 資料庫欄位

行程資料庫：

| 欄位名稱 | Notion 類型 |
| --- | --- |
| `Name` | Title |
| `Time` | Date |
| `Order` | Number |
| `標籤` | Select |
| `google map連結` | URL |
| `票券預定` | Select |
| `預定時間` | Text |
| `註解` | Text |

購物清單資料庫：

| 欄位名稱 | Notion 類型 |
| --- | --- |
| `名稱` | Title |
| `商品類型` | Text |
| `商店類型` | Select |
| `購買商店` | Text |
| `商品說明` | Text |
| `是否要買` | Checkbox |
| `已購買` | Checkbox |

欄位名稱需與上表一致。購物清單只會顯示「是否要買」已勾選且「已購買」未勾選的項目。

## 本機執行

在專案根目錄執行：

```powershell
npm install --prefix frontend
npx netlify-cli dev
```

依終端機顯示的網址開啟網站。Netlify Dev 會讀取根目錄的 `.env`，並同時啟動前端與 Functions。

## 部署到 Netlify

1. 將 Repository 推送到 GitHub。
2. 在 Netlify 選擇 **Add new project → Import an existing project**，並選取此 Repository。
3. 在 Netlify 的環境變數設定中加入 `NOTION_TOKEN`、`NOTION_DATABASE_ID`、`NOTION_SHOPPINGLIST_DATABASE_ID`。
4. 執行部署；建置設定已寫在 `netlify.toml`。

目前 API 沒有登入驗證，請只連接可以公開顯示的 Notion 資料庫。

## 測試與建置

```powershell
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
node --test netlify/tests/notion.test.js netlify/tests/shopping.test.js
```

## 授權

本專案採用 [MIT License](LICENSE)。
