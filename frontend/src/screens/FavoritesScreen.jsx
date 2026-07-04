import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { api } from "../lib/api";

const TYPE_ICON = { entry: "📚", tool: "🛠", prompt: "⚡" };

export function FavoritesScreen({ onOpenEntry }) {
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
    if (item.item_type === "tool" && item.tool_repo) window.open(`https://github.com/${item.tool_repo}`, "_blank");
  };

  return (
    <>
      <PromptLine section="favorites" />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !items && <Spinner />}
        {items && items.length === 0 && <EmptyState text="звёздочка на карточке добавит её сюда" />}

        {items?.map((item) => (
          <div
            key={`${item.item_type}-${item.item_id}`}
            className="card"
            onClick={() => openItem(item)}
            style={{ cursor: item.item_type === "prompt" ? "default" : "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="card__meta">{TYPE_ICON[item.item_type]} {item.item_type}</span>
                <p className="card__title" style={{ margin: "4px 0" }}>{item.title}</p>
                {item.subtitle && <p className="card__meta">{item.subtitle}</p>}
              </div>
              <FavStar itemType={item.item_type} itemId={item.item_id} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
