import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { ArticleBody } from "../components/ArticleBody";
import { Spinner } from "../components/States";
import { api } from "../lib/api";
import { getReadingTime } from "../lib/readingTime";

// Витрина до гейта.
//
// Раньше здесь были три числа и кнопка «Подписаться» — подписку просили авансом,
// за кота в мешке. Хуже того, deep link из поста канала (entry_{slug}) вёл на ту же
// заглушку: человек шёл за конкретной статьёй и не видел её, то есть весь трафик
// с точечных постов обесценивался.
//
// Теперь: показываем статью целиком. Если пришли по deep link — именно ту, за которой
// пришли; иначе первую из витрины. Наружу доступны только статьи с preview: true
// во frontmatter, всё остальное по-прежнему за гейтом (routers/public.py).
export function GateScreen({ previewSlug, onRecheckSuccess }) {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [entry, setEntry] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(true);
  // Числа берём из публичной ручки, а не из /api/home: тот требует подписку,
  // а дерево рисуется как раз НЕподписанному — раньше там всегда были многоточия.
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .publicCounts()
      .then((res) => !cancelled && setCounts(res))
      .catch(() => {});

    // Сначала пробуем статью из deep link. Непомеченная отдаёт 404 — это
    // не ошибка, а штатный случай: откатываемся на первую статью витрины.
    //
    // Важно: /public/entries отдаёт только карточки (slug/title/summary) без тела,
    // поэтому за запасной статьёй нужен второй запрос по слагу. Без него гейт
    // показывал бы заголовок без текста — то есть ровно ту заглушку, ради
    // устранения которой всё это и делается.
    const load = previewSlug
      ? api.publicEntry(previewSlug).catch(() => null)
      : Promise.resolve(null);

    load
      .then((byLink) => {
        if (byLink) return byLink;
        return api
          .publicEntries()
          .then((res) => res.entries?.[0]?.slug)
          .then((slug) => (slug ? api.publicEntry(slug) : null));
      })
      .then((result) => {
        if (!cancelled) setEntry(result);
      })
      .catch(() => {
        // Витрина не обязана работать, чтобы гейт работал: не показали статью —
        // человек всё равно видит призыв подписаться, как и раньше.
        if (!cancelled) setEntry(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingEntry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [previewSlug]);

  const handleSubscribeClick = () => {
    window.open("https://t.me/claudedry", "_blank");
  };

  const handleRecheck = async () => {
    setChecking(true);
    setFailed(false);
    try {
      const res = await api.gateRecheck();
      if (res.subscribed) {
        onRecheckSuccess();
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };

  const cta = (
    <div className="gate-cta">
      <p className="gate-cta__title">
        {entry ? "Это одна статья из базы" : "Доступ открыт подписчикам @claudedry"}
      </p>
      <pre className="gate-cta__tree">
{`baza/
├── entries    (${counts?.entries_count ?? "…"} статей)
├── tools      (${counts?.tools_count ?? "…"} инструментов)
└── prompts    (${counts?.prompts_count ?? "…"} промптов)`}
      </pre>
      <p className="gate-cta__hint">
        Остальное открывается подпиской на <b>@claudedry</b>. Бесплатно, отписаться
        можно в любой момент.
      </p>
      <button className="btn btn--primary gate-cta__btn" onClick={handleSubscribeClick}>
        Подписаться на @claudedry
      </button>
      <button className="btn btn--ghost gate-cta__btn" onClick={handleRecheck} disabled={checking}>
        {checking ? "Проверяю…" : "Я подписался — проверить"}
      </button>
      {failed && (
        <p className="gate-cta__failed">
          Подписка не найдена. Telegram обновляет её не мгновенно — попробуйте ещё раз
          через несколько секунд.
        </p>
      )}
    </div>
  );

  return (
    <>
      <AppHeader title="Baza" subtitle="без воды" />
      <div className="page">
        {loadingEntry && <Spinner />}
        {!loadingEntry && entry && (
          <div className="sheet" style={{ position: "relative" }}>
            <div className="entry-hero-glow" aria-hidden="true" />
            <h1 style={{ color: "var(--text)", fontSize: 24, marginTop: 0, position: "relative", zIndex: 1 }}>
              {entry.title}
            </h1>
            <p className="gate-preview__meta">
              {getReadingTime(entry.body_md)} · открыто без подписки
            </p>
            <ArticleBody bodyMd={entry.body_md} />
          </div>
        )}
        {!loadingEntry && cta}
      </div>
    </>
  );
}
