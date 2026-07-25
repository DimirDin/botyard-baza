import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { ArticleBody } from "../components/ArticleBody";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { shareLink } from "../lib/telegram";
import { trackEvent } from "../lib/track";
import { getReadingTime } from "../lib/readingTime";

export function EntryScreen({ slug }) {
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = () => {
    setError(false);
    setEntry(null);
    api.entry(slug).then(setEntry).catch(() => setError(true));
  };

  useEffect(load, [slug]);

  useEffect(() => {
    if (entry) trackEvent("view_entry", { slug: entry.slug, title: entry.title, section: entry.section });
  }, [entry]);

  useEffect(() => {
    const pageEl = document.querySelector(".page");
    if (!pageEl) return;

    const handleScroll = () => {
      const total = pageEl.scrollHeight - pageEl.clientHeight;
      if (total <= 0) {
        setProgress(0);
      } else {
        const pct = Math.min(100, Math.max(0, (pageEl.scrollTop / total) * 100));
        setProgress(pct);
      }
    };

    pageEl.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => pageEl.removeEventListener("scroll", handleScroll);
  }, [entry]);

  const readTime = getReadingTime(entry?.body_md);

  return (
    <>
      <AppHeader
        title="Статья"
        subtitle={entry?.updated_at ? `обновлено ${entry.updated_at.slice(0, 10)} · ${readTime}` : undefined}
      />
      {progress > 0 && (
        <div
          className="reading-progress-bar"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      )}
      <div className="page" style={{ position: "relative" }}>
        {error && <ErrorState onRetry={load} />}
        {!error && !entry && <Spinner />}
        {entry && (
          <div className="sheet" style={{ position: "relative" }}>
            <div className="entry-hero-glow" aria-hidden="true" />
            <div className="card__row" style={{ position: "relative", zIndex: 1 }}>
              <h1 style={{ color: "var(--text)", fontSize: 24, marginTop: 0 }}>{entry.title}</h1>
              <FavStar itemType="entry" itemId={entry.id} />
            </div>
            <ArticleBody bodyMd={entry.body_md} />
            <button
              // ?start= (не ?startapp=): Main Mini App в BotFather не настроен,
              // deep link идёт через /start бота → web_app-кнопку (см. bot/main.py)
              className="btn btn--outline-accent"
              onClick={() => shareLink(`https://t.me/bazadry_bot?start=entry_${entry.slug}`, entry.title)}
              style={{ marginTop: 16 }}
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
