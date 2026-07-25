import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { api } from "../lib/api";
import { getAmbientEnabled, setAmbientEnabled } from "../lib/prefs";

const TYPE_LABEL = { entry: "статья", tool: "инструмент", prompt: "промпт", guide: "урок", component: "компонент" };

export function FavoritesScreen({ onOpenEntry, onOpenTool, onOpenGuide, onNavigate }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setItems(null);
    api.favorites().then(setItems).catch(() => setError(true));
  };

  useEffect(load, []);

  const openItem = (item) => {
    if (item.item_type === "entry" && item.entry_slug) onOpenEntry(item.entry_slug);
    if (item.item_type === "tool" && item.tool_repo) onOpenTool(item.tool_repo.replace("/", "__"));
    if (item.item_type === "guide" && item.guide_slug) onOpenGuide(item.guide_level, item.guide_slug);
  };

  return (
    <>
      <AppHeader
        title="Моё"
        subtitle="избранное"
        action={<button className="icon-btn" onClick={() => onNavigate("search")}>поиск</button>}
      />
      <div className="page">
        <section className="sect">
          <span className="eyebrow">оформление</span>
          <button
            className="btn btn--ghost"
            onClick={() => {
              setAmbientEnabled(!getAmbientEnabled());
              window.location.reload();
            }}
          >
            {getAmbientEnabled() ? "Выключить живой фон" : "Включить живой фон"}
          </button>
        </section>

        {error && <ErrorState onRetry={load} />}
        {!error && !items && <Spinner />}
        {items && items.length === 0 && <EmptyState text="звёздочка на карточке добавит её сюда" />}

        <div className="stack">
          {items?.map((item) => (
            <div
              key={`${item.item_type}-${item.item_id}`}
              className="card"
              onClick={() => openItem(item)}
              style={{ cursor: item.item_type === "prompt" ? "default" : "pointer" }}
            >
              <div className="card__pad">
                <div className="card__row">
                  <div>
                    <span className="chip">{TYPE_LABEL[item.item_type]}</span>
                    <p className="card__title">{item.title}</p>
                    {item.subtitle && <p className="card__meta">{item.subtitle}</p>}
                  </div>
                  <FavStar itemType={item.item_type} itemId={item.item_id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
