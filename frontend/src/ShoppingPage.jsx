import { useEffect, useMemo, useState } from "react";

const ALL_STORE_TYPES = "全部商店類型";

async function fetchShoppingItems() {
  const response = await fetch(`/.netlify/functions/shopping?refresh=${Date.now()}`, {
    cache: "no-store"
  });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`購物清單 API 回傳 ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("購物清單 API 格式不正確");
  return data;
}

function ShoppingPage({ onShowTrips }) {
  const [items, setItems] = useState([]);
  const [selectedStoreType, setSelectedStoreType] = useState(ALL_STORE_TYPES);
  const [expandedItemId, setExpandedItemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let active = true;

    fetchShoppingItems()
      .then(data => {
        if (!active) return;
        setConfigured(data !== null);
        setItems(data ?? []);
      })
      .catch(error => {
        if (!active) return;
        console.error(error);
        setLoadError("購物清單載入失敗，請稍後再試");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function refreshShoppingItems() {
    setLoading(true);
    setLoadError("");

    try {
      const data = await fetchShoppingItems();
      setConfigured(data !== null);
      setItems(data ?? []);
      setExpandedItemId("");
      setSelectedStoreType(current => {
        const availableTypes = new Set((data ?? []).map(item => item?.storeType).filter(Boolean));
        return current === ALL_STORE_TYPES || availableTypes.has(current)
          ? current
          : ALL_STORE_TYPES;
      });
    } catch (error) {
      console.error(error);
      setLoadError("購物清單載入失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  const storeTypes = useMemo(
    () => [...new Set(items.map(item => item?.storeType).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "zh-Hant")),
    [items]
  );

  const visibleItems = selectedStoreType === ALL_STORE_TYPES
    ? items
    : items.filter(item => item.storeType === selectedStoreType);

  return (
    <main className="page page--shopping view-enter">
      <header className="hero shopping-hero">
        <div>
          <p className="eyebrow">Shopping List</p>
          <h1>我的購物清單</h1>
          <p className="subtitle">只帶走真正想買的旅行好物</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="view-switch" onClick={onShowTrips}>
            ✈️ 行程清單
          </button>
          <div className="hero-emoji" aria-hidden="true">🛍️</div>
        </div>
      </header>

      {configured && <section className="shopping-toolbar" aria-label="購物清單篩選與更新">
        <label className="store-filter">
          <span>商店類型</span>
          <select
            value={selectedStoreType}
            onChange={event => {
              setSelectedStoreType(event.target.value);
              setExpandedItemId("");
            }}
          >
            <option value={ALL_STORE_TYPES}>{ALL_STORE_TYPES}</option>
            {storeTypes.map(storeType => (
              <option key={storeType} value={storeType}>{storeType}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="refresh-button"
          onClick={refreshShoppingItems}
          disabled={loading}
        >
          <span className={loading ? "refresh-icon refresh-icon--spinning" : "refresh-icon"}>↻</span>
          {loading ? "更新中" : "更新資料"}
        </button>
      </section>}

      <section className="shopping-list" aria-live="polite" aria-busy={loading}>
        <div className="shopping-list-heading">
          <h2>{selectedStoreType}</h2>
          {!loading && !loadError && configured && <span>{visibleItems.length} 項待購買</span>}
        </div>

        {loading && items.length === 0 && (
          <div className="loading-card shopping-loading">購物清單載入中 🛍️</div>
        )}

        {loadError && <div className="state-card state-card--error">{loadError}</div>}

        {!loading && !loadError && !configured && (
          <div className="state-card">
            購買清單尚未啟用，完成 README 的選用設定後即可使用。
          </div>
        )}

        {!loading && !loadError && configured && visibleItems.length === 0 && (
          <div className="state-card">這個分類目前沒有待購買商品</div>
        )}

        {!loadError && visibleItems.map(item => {
          const expanded = expandedItemId === item.id;

          return (
            <button
              type="button"
              key={item.id}
              className={`shopping-card ${expanded ? "shopping-card--expanded" : ""}`}
              onClick={() => setExpandedItemId(expanded ? "" : item.id)}
              aria-expanded={expanded}
            >
              <span className="shopping-card-top">
                <span className="shopping-card-main">
                  <span className="shopping-card-title">{item.name || "未命名商品"}</span>
                  <span className="shopping-card-meta">
                    {item.productType && (
                      <span className="shopping-badge shopping-badge--product">
                        {item.productType}
                      </span>
                    )}
                    {item.store && (
                      <span className="shopping-badge shopping-badge--store">
                        📍 {item.store}
                      </span>
                    )}
                  </span>
                </span>
                <span className="shopping-card-arrow" aria-hidden="true">⌄</span>
              </span>

              <span className="shopping-description" hidden={!expanded}>
                {item.description || "目前沒有商品說明"}
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}

export default ShoppingPage;
