import { useSyncExternalStore } from "react";
import { getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from "../lib/favorites";

export function FavStar({ itemType, itemId }) {
  const keys = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot);
  const active = keys.has(`${itemType}:${itemId}`);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(itemType, itemId);
      }}
      aria-label={active ? "убрать из избранного" : "в избранное"}
      style={{
        background: "none", border: "none", cursor: "pointer", padding: "2px 6px",
        fontSize: 16, color: active ? "var(--accent)" : "var(--text-muted-dim)", lineHeight: 1,
      }}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
