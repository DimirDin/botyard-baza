import { useState, useSyncExternalStore } from "react";
import { getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from "../lib/favorites";
import { triggerHaptic } from "../lib/telegram";

export function FavStar({ itemType, itemId }) {
  const keys = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot);
  const active = keys.has(`${itemType}:${itemId}`);
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic("selection");
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
    toggleFavorite(itemType, itemId);
  };

  return (
    <button
      className={`fav-btn ${active ? "fav-btn--active" : ""} ${animating ? "fav-btn--animating" : ""}`}
      onClick={handleClick}
      aria-label={active ? "убрать из избранного" : "в избранное"}
    >
      <span className="fav-btn__star">{active ? "★" : "☆"}</span>
      <span>{active ? "в избранном" : "в избранное"}</span>
    </button>
  );
}
