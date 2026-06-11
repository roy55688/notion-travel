import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "";

function groupByDate(items) {
  return items.reduce((groups, item) => {
    const date = item.date || "未分類";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});
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
      const res = await fetch(`${API_BASE}/.netlify/functions/notion`);
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

    const res = await fetch(`${API_BASE}/.netlify/functions/page?id=${item.id}`);
    const data = await res.json();

    setPageContent(data.content || []);
    setDetailLoading(false);
  }

  const grouped = groupByDate(items);
  const dates = Object.keys(grouped).sort();
  const dayItems = grouped[selectedDate] || [];

  if (loading) {
    return <div className="page">載入行程中...</div>;
  }

  return (
    <div className="page">
      <h1>旅行行程</h1>

      <div className="date-tabs">
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
            {date}
          </button>
        ))}
      </div>

      <div className="layout">
        <section className="list">
          {dayItems.map(item => (
            <div
              key={item.id}
              className="card"
              onClick={() => openItem(item)}
            >
              <div className="card-title">{item.name}</div>

              {item.tag && <div className="tag">{item.tag}</div>}

              {item.mapUrl && (
                <a
                  href={item.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  Google Map
                </a>
              )}
            </div>
          ))}
        </section>

        <section className="detail">
          {!selectedItem && <p>請選擇一個行程項目</p>}

          {selectedItem && (
            <>
              <h2>{selectedItem.name}</h2>

              {detailLoading && <p>載入內容中...</p>}

              {!detailLoading && pageContent.map((block, index) => {
                if (block.type === "paragraph") {
                  return <p key={index}>{block.text}</p>;
                }

                if (block.type === "image") {
                  return (
                    <img
                      key={index}
                      src={block.url}
                      alt=""
                      className="content-image"
                    />
                  );
                }

                return null;
              })}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;