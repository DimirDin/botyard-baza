import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { ArticleBody } from "../components/ArticleBody";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { shareLink } from "../lib/telegram";

export function EntryScreen({ slug }) {
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setEntry(null);
    api.entry(slug).then(setEntry).catch(() => setError(true));
  };

  useEffect(load, [slug]);

  return (
    <>
      <PromptLine
        section="base"
        right={entry ? <span>обновлено {entry.updated_at?.slice(0, 10)}</span> : null}
      />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !entry && <Spinner />}
        {entry && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0 }}>{entry.title}</h1>
              <FavStar itemType="entry" itemId={entry.id} />
            </div>
            <ArticleBody bodyMd={entry.body_md} />
            <button
              // ?start= (не ?startapp=): Main Mini App в BotFather не настроен,
              // deep link идёт через /start бота → web_app-кнопку (см. bot/main.py)
              onClick={() => shareLink(`https://t.me/bazadry_bot?start=entry_${entry.slug}`, entry.title)}
              style={{
                marginTop: 16, padding: "8px 16px", background: "transparent", color: "var(--accent)",
                border: "1px solid var(--accent)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 13,
              }}
            >
              ↗ поделиться
            </button>
          </>
        )}
      </div>
    </>
  );
}
