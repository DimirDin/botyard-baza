import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { ArticleBody } from "../components/ArticleBody";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { shareLink } from "../lib/telegram";
import { trackEvent } from "../lib/track";

export function EntryScreen({ slug }) {
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setEntry(null);
    api.entry(slug).then(setEntry).catch(() => setError(true));
  };

  useEffect(load, [slug]);

  useEffect(() => {
    if (entry) trackEvent("view_entry", { slug: entry.slug, title: entry.title, section: entry.section });
  }, [entry]);

  return (
    <>
      <AppHeader
        title="Статья"
        subtitle={entry?.updated_at ? `обновлено ${entry.updated_at.slice(0, 10)}` : undefined}
      />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !entry && <Spinner />}
        {entry && (
          <div className="sheet">
            <div className="card__row">
              <h1 style={{ color: "var(--text-heading)", fontSize: 24, marginTop: 0 }}>{entry.title}</h1>
              <FavStar itemType="entry" itemId={entry.id} />
            </div>
            <ArticleBody bodyMd={entry.body_md} />
            <button
              // ?start= (не ?startapp=): Main Mini App в BotFather не настроен,
              // deep link идёт через /start бота → web_app-кнопку (см. bot/main.py)
              onClick={() => shareLink(`https://t.me/bazadry_bot?start=entry_${entry.slug}`, entry.title)}
              style={{
                marginTop: 16, padding: "8px 16px", background: "transparent", color: "var(--accent)",
                border: "1px solid var(--accent)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 14,
              }}
            >
              ↗ поделиться
            </button>
            <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
              <button
                onClick={() => api.rateEntry(entry.slug, 1).then((r) => setEntry({ ...entry, ...r }))}
                className={`chip ${entry.my_rating === 1 ? "chip--active" : ""}`}
                style={{ border: "none" }}
              >
                👍 {entry.likes}
              </button>
              <button
                onClick={() => api.rateEntry(entry.slug, -1).then((r) => setEntry({ ...entry, ...r }))}
                className={`chip ${entry.my_rating === -1 ? "chip--active" : ""}`}
                style={{ border: "none" }}
              >
                👎 {entry.dislikes}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
