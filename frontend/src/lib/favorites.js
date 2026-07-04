// Общее состояние избранного: один Set ключей "type:id" на всё приложение,
// компоненты подписываются через useSyncExternalStore (см. components/FavStar.jsx).
import { api } from "./api";

let keys = new Set();
let loaded = false;
let loading = null;
const listeners = new Set();

function emit() {
  keys = new Set(keys); // новая ссылка — иначе useSyncExternalStore не увидит изменение
  listeners.forEach((fn) => fn());
}

export function subscribeFavorites(fn) {
  listeners.add(fn);
  if (!loaded && !loading) {
    loading = api
      .favoriteIds()
      .then((ids) => {
        keys = new Set(ids);
        loaded = true;
        emit();
      })
      .catch(() => {})
      .finally(() => (loading = null));
  }
  return () => listeners.delete(fn);
}

export function getFavoritesSnapshot() {
  return keys;
}

export async function toggleFavorite(itemType, itemId) {
  const key = `${itemType}:${itemId}`;
  // оптимистично — откатим, если API упадёт
  const had = keys.has(key);
  had ? keys.delete(key) : keys.add(key);
  emit();
  try {
    await api.toggleFavorite(itemType, itemId);
  } catch {
    had ? keys.add(key) : keys.delete(key);
    emit();
  }
}
