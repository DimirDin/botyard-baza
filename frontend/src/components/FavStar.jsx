import { useSyncExternalStore } from "react";
import { getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from "../lib/favorites";

export function FavStar({ itemType, itemId }) {
  const keys = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot);
  const active = keys.has(`${itemType}:${itemId}`);

  return (
    <button
      className={`fav-btn ${active ? "fav-btn--active" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(itemType, itemId);
      }}
      aria-label={active ? "убрать из избранного" : "в избранное"}
    >
      <span className="fav-btn__star">{active ? "★" : "☆"}</span>
      <span>{active ? "в избранном" : "в избранное"}</span>
    </button>
  );
}
