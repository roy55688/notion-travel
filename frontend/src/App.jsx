import { useEffect, useState } from "react";
import "./App.css";
import { cachePage, getCachedPage } from "./pageCache.js";
import {
  EMPTY_DATE_LABEL,
  formatTripDate,
  getInitialTripDate,
  getTicketStatusTone
} from "./tripDisplay.js";

function groupByDate(items) {
  return items.reduce((groups, item) => {
    const date = item?.date || EMPTY_DATE_LABEL;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});
}

function TicketReservation({ status, reservationTime }) {
  return (
    <>
      {status && (
        <span className={`ticket-status ticket-status--${getTicketStatusTone(status)}`}>
          🎟️ {status}
        </span>
      )}

      {reservationTime && (
        <span className="reservation-time">
          🕒 {reservationTime}
        </span>
      )}
    </>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [pageContent, setPageContent] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadTrips() {
      try {
        const res = await fetch("/.netlify/functions/notion");
        if (!res.ok) throw new Error(`行程 API 回傳 ${res.status}`);

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("行程 API 格式不正確");

        setItems(data);

        const dates = [...new Set(data.map(x => x?.date || EMPTY_DATE_LABEL))].sort();
        setSelectedDate(getInitialTripDate(dates, window.location.pathname));
      } catch (error) {
        console.error(error);
        setItems([]);
        setLoadError("行程載入失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, []);

  async function openItem(item) {
    setSelectedItem(item);

    if (!item?.id) {
      setPageContent([]);
      setDetailLoading(false);
      return;
    }

    const cachedContent = getCachedPage(item.id, item.lastEditedTime);
    if (cachedContent) {
      setPageContent(cachedContent);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setPageContent([]);

    try {
      const params = new URLSearchParams({
        id: item.id,
        edited: item.lastEditedTime || ""
      });
      const res = await fetch(`/.netlify/functions/page?${params}`);
      if (!res.ok) throw new Error(`筆記 API 回傳 ${res.status}`);

      const data = await res.json();

      // 兼容兩種格式：
      // 1. { pageId, content: [...] }
      // 2. [...]
      const content = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : [];

      cachePage(item.id, content, item.lastEditedTime);
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
  const dayItems = [...(grouped[selectedDate] || [])]
    .sort((a, b) => (a?.order ?? 9999) - (b?.order ?? 9999));

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
            <span>{formatTripDate(date)}</span>
            <small>{grouped[date].length} 項</small>
          </button>
        ))}
      </nav>

      <section className="content">
        <div className="list">
          <h2>{formatTripDate(selectedDate)} 行程</h2>

          {loadError && <div className="state-card state-card--error">{loadError}</div>}

          {!loadError && dayItems.length === 0 && (
            <div className="state-card">目前沒有可顯示的行程</div>
          )}

          {dayItems.map(item => (
            <article
              key={item.id}
              className={`card ${selectedItem?.id === item.id ? "selected" : ""}`}
              onClick={() => openItem(item)}
            >
              <div className="card-main">
                <div className="card-title">{item.name || "未命名行程"}</div>
                {item.annotation && (
                  <div className="card-annotation">{item.annotation}</div>
                )}

                <div className="card-meta">
                  {item.tag && <span className="tag">{item.tag}</span>}
                  <TicketReservation
                    status={item.ticketStatus}
                    reservationTime={item.reservationTime}
                  />
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
              <div className="empty-emoji">🗺️</div>
              <p>
                點選<span className="desktop-only">左側</span><span className="mobile-only">上方</span>的行程項目查看筆記
              </p>
            </div>
          )}

          {selectedItem && (
            <>
              <div className="detail-header">
                <p className="detail-date">{formatTripDate(selectedItem.date)}</p>
                <h2>{selectedItem.name || "未命名行程"}</h2>
                <div className="detail-meta">
                  {selectedItem.tag && <span className="tag">{selectedItem.tag}</span>}
                  <TicketReservation
                    status={selectedItem.ticketStatus}
                    reservationTime={selectedItem.reservationTime}
                  />
                </div>
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
					  <button
						type="button"
						className="image-button"
						onClick={() => setPreviewImage(block)}
					  >
						<img
						  src={block.url}
						  alt={block.caption || ""}
						  className="content-image"
						/>
					  </button>

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
	  {previewImage && (
		  <div
			className="image-modal"
			onClick={() => setPreviewImage(null)}
		  >
			<button
			  type="button"
			  className="image-modal-close"
			  onClick={() => setPreviewImage(null)}
			>
			  ×
			</button>

			<img
			  src={previewImage.url}
			  alt={previewImage.caption || ""}
			  className="image-modal-img"
			  onClick={e => e.stopPropagation()}
			/>

			{previewImage.caption && (
			  <div
				className="image-modal-caption"
				onClick={e => e.stopPropagation()}
			  >
				{previewImage.caption}
			  </div>
			)}
		  </div>
		)}
    </main>
  );
}

export default App;
