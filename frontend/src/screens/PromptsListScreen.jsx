import { useEffect, useRef, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { PROMPTS_MENU } from "../config/menu";
import { api } from "../lib/api";
import { showToast } from "../lib/toast";

// initial — переход с конкретного промпта (например, «топ промптов» на Home):
// { category: "content/compress", slug: "..." } сразу открывает нужную группу
// и подсвечивает карточку, а не просто кидает на список групп раздела.
export function PromptsListScreen({ initial, onNavigate } = {}) {
  const [tab, setTab] = useState(() => initial?.category?.split("/")[0] || "code");
  const [group, setGroup] = useState(() => initial?.category?.split("/")[1] || null);
  const [prompts, setPrompts] = useState(null); // все промпты (одним запросом)
  const [error, setError] = useState(false);
  const highlightSlug = initial?.slug;
  const highlightRef = useRef(null);

  const load = () => {
    setError(false);
    setPrompts(null);
    api.prompts().then(setPrompts).catch(() => setError(true));
  };

  useEffect(load, []);

  // Скролл к промпту, указанному в deep link'е (§16)
  useEffect(() => {
    if (highlightSlug && group && prompts) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [highlightSlug, group, prompts]);

  const section = PROMPTS_MENU.find((m) => m.slug === tab) || PROMPTS_MENU[0];
  const counts = prompts
    ? prompts.reduce((acc, p) => {
        const [cTab, cGroup] = (p.category || "").split("/");
        if (cTab === tab && cGroup) acc[cGroup] = (acc[cGroup] || 0) + 1;
        return acc;
      }, {})
    : null;
  const groupPrompts = group && prompts ? prompts.filter((p) => p.category === `${tab}/${group}`) : [];
  const groupLabel = section?.groups.find((g) => g.slug === group)?.label;

  const handleCopy = async (p) => {
    try {
      await navigator.clipboard.writeText(p.body);
      showToast("Промпт скопирован", "success");
    } catch {
      showToast("Не удалось скопировать", "error");
    }
    api.copyPrompt(p.slug).catch(() => {});
  };

  return (
    <>
      <AppHeader
        title="Промпты"
        subtitle={group ?? "библиотека"}
        action={
          group ? (
            <button className="icon-btn" onClick={() => setGroup(null)} aria-label="Назад">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          ) : (
            <button className="icon-btn" onClick={() => onNavigate("search")} aria-label="Поиск">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
          )
        }
      />
      {!group && <SectionTabs menu={PROMPTS_MENU} active={tab} onSelect={setTab} iconBase="/icons/prompts" />}
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !prompts && <Spinner />}

        {prompts && !group && (
          <GroupList groups={section.groups} counts={counts} onOpen={setGroup} iconBase={`/icons/prompts/${tab}`} />
        )}

        {group && (
          <>
            <p className="card__meta">
              {groupLabel} ({groupPrompts.length})
            </p>
            {groupPrompts.length === 0 && <EmptyState />}
            <div className="stack">
              {groupPrompts.map((p) => (
                <div
                  key={p.slug}
                  ref={p.slug === highlightSlug ? highlightRef : null}
                  className="card"
                  style={p.slug === highlightSlug ? { border: "1px solid var(--accent)" } : undefined}
                >
                  <div className="card__pad">
                    <div className="card__row">
                      <p className="card__title">{p.title}</p>
                      <FavStar itemType="prompt" itemId={p.id} />
                    </div>
                    {p.comment && <p className="card__meta">{p.comment}</p>}
                    <p style={{ color: "var(--text-2)", fontSize: 14, margin: "8px 0", whiteSpace: "pre-wrap" }}>
                      {p.body.length > 160 ? `${p.body.slice(0, 160)}…` : p.body}
                    </p>
                    <div className="card__row">
                      <span className="card__meta">{p.copies_count} копирований</span>
                      <button
                        onClick={() => handleCopy(p)}
                        style={{
                          background: "var(--accent)", color: "#111110", border: "none", borderRadius: 4,
                          padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600,
                        }}
                      >
                        скопировать
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
