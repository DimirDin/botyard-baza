import { CHEAT_CATEGORIES } from "../config/menu";

/**
 * Группирует шпаргалки по category, сохраняя порядок из CHEAT_CATEGORIES.
 * Категория, которой нет в реестре, не теряется — уезжает в конец отдельной секцией
 * под собственным слагом (так новая категория в контенте видна сразу, ещё до правки menu.js).
 */
export function groupCheatsheets(items) {
  const known = CHEAT_CATEGORIES.map((c) => c.slug);
  const byCat = new Map();
  items.forEach((item) => {
    const key = item.category || "other";
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key).push(item);
  });
  return [...byCat.keys()]
    .sort((a, b) => {
      const ia = known.indexOf(a);
      const ib = known.indexOf(b);
      return (ia === -1 ? known.length : ia) - (ib === -1 ? known.length : ib);
    })
    .map((slug) => ({
      slug,
      label: CHEAT_CATEGORIES.find((c) => c.slug === slug)?.label || slug,
      items: byCat.get(slug),
    }));
}
