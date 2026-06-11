import { useEffect, useState } from "react";
import "./App.css";

function groupByDate(items) {
  return items.reduce((groups, item) => {
    const date = item.date || "未分類";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});
}

function formatDate(dateText) {
  if (dateText === "未分類") return "未分類";
  const date = new Date(dateText);
  return date.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
}

function App() {
  const [items, setItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [pageContent, setPageContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function loadTrips() {
      const res = await fetch("/.netlify/functions/notion");
      const data = await res.json();

      setItems(data);

      const dates = [...new Set(data.map(x => x.date || "未分類"))].sort();
      setSelectedDate(dates[0] || "");

      setLoading(false);
    }

    loadTrips();
  }, []);

  async function openItem(item) {
    setSelectedItem(item);
    setDetailLoading(true);
    setPageContent([]);

    try {
      const res = await fetch(`/.netlify/functions/page?id=${item.id}`);
      const data = await res.json();

      // 兼容兩種格式：
      // 1. { pageId, content: [...] }
      // 2. [...]
      const content = Array.isArray(data) ? data : data.content || [];

      setPageContent(content);
    } catch (error) {
      console.error(error);
      setPageContent([
        {
          type: "paragraph",
          text: "內容載入失敗"
        }
      ]);
    } finally {
      setDetailLoading(false);
    }
  }

  const grouped = groupByDate(items);
  const dates = Object.keys(grouped).sort();
  const dayItems = grouped[selectedDate] || [];

  if (loading) {
    return (
      <main className="page">
        <div className="loading-card">行程載入中 ✈️</div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Travel Planner</p>
          <h1>我的旅行行程</h1>
          <p className="subtitle">從 Notion 同步，手機友善查看</p>
        </div>
        <div className="hero-emoji">🧳</div>
      </header>

      <nav className="date-tabs">
        {dates.map(date => (
          <button
            key={date}
            className={date === selectedDate ? "active" : ""}
            onClick={() => {
              setSelectedDate(date);
              setSelectedItem(null);
              setPageContent([]);
            }}
          >
            <span>{formatDate(date)}</span>
            <small>{grouped[date].length} 項</small>
          </button>
        ))}
      </nav>

      <section className="content">
        <div className="list">
          <h2>{formatDate(selectedDate)} 行程</h2>

          {dayItems.map(item => (
            <article
              key={item.id}
              className={`card ${selectedItem?.id === item.id ? "selected" : ""}`}
              onClick={() => openItem(item)}
            >
              <div className="card-main">
                <div className="card-title">{item.name}</div>

                <div className="card-meta">
                  {item.tag && <span className="tag">{item.tag}</span>}
                  {item.mapUrl && (
                    <a
                      href={item.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      🗺️ 地圖
                    </a>
                  )}
                </div>
              </div>

              <div className="card-arrow">›</div>
            </article>
          ))}
        </div>

        <aside className="detail">
          {!selectedItem && (
            <div className="empty-detail">
              <div className="empty-emoji">🌷</div>
              <p>點選左邊的行程項目查看筆記</p>
            </div>
          )}

          {selectedItem && (
            <>
              <div className="detail-header">
                <p className="detail-date">{formatDate(selectedItem.date || "未分類")}</p>
                <h2>{selectedItem.name}</h2>
                {selectedItem.tag && <span className="tag">{selectedItem.tag}</span>}
              </div>

              {detailLoading && <p className="note">筆記載入中...</p>}

              {!detailLoading && pageContent.length === 0 && (
                <p className="note">這個項目目前沒有筆記內容</p>
              )}

              {!detailLoading && pageContent.map((block, index) => {
                if (block.type === "paragraph") {
                  return block.text ? <p key={index} className="paragraph">{block.text}</p> : null;
                }

                if (block.type === "image" && block.url) {
				  return (
					<figure key={index} className="image-block">
					  <img
						src={block.url}
						alt={block.caption || ""}
						className="content-image"
					  />
					  {block.caption && (
						<figcaption>{block.caption}</figcaption>
					  )}
					</figure>
				  );
				}

                return null;
              })}
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;