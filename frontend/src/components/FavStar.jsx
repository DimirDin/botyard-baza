import { useState, useSyncExternalStore } from "react";
import { getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from "../lib/favorites";
import { triggerHaptic } from "../lib/telegram";
import { showToast } from "../lib/toast";

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
    const nextActive = !active;
    showToast(nextActive ? "Добавлено в избранное" : "Удалено из избранного", nextActive ? "success" : "info");
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
