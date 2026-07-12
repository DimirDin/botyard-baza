import { useEffect, useRef, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { Toast } from "../components/Toast";
import { PROMPTS_MENU } from "../config/menu";
import { api } from "../lib/api";
import { hapticSuccess } from "../lib/telegram";

// initial — переход с конкретного промпта (например, «топ промптов» на Home):
// { category: "content/compress", slug: "..." } сразу открывает нужную группу
// и подсвечивает карточку, а не просто кидает на список групп раздела.
export function PromptsListScreen({ initial, onNavigate } = {}) {
  const [tab, setTab] = useState(() => initial?.category?.split("/")[0] || "code");
  const [group, setGroup] = useState(() => initial?.category?.split("/")[1] || null);
  const [prompts, setPrompts] = useState(null); // все промпты (одним запросом)
  const [error, setError] = useState(false);
  const [toast, setToast] = useState(null); // { message, error }
  const highlightSlug = initial?.slug;
  const highlightRef = useRef(null);
  // Сравнение со значением, а не одноразовый флаг — React 18 StrictMode вызывает
  // эффект монтирования дважды в dev-режиме, одноразовый флаг «съедался» первым
  // вызовом и второй уже сбрасывал group сразу после монтирования.
  const prevTabRef = useRef(tab);

  const load = () => {
    setError(false);
    setPrompts(null);
    api.prompts().then(setPrompts).catch(() => setError(true));
  };

  useEffect(load, []);
  useEffect(() => {
    if (prevTabRef.current !== tab) {
      prevTabRef.current = tab;
      setGroup(null);
    }
  }, [tab]);

  useEffect(() => {
    if (highlightSlug && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [prompts, highlightSlug]);

  const section = PROMPTS_MENU.find((s) => s.slug === tab);
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
      hapticSuccess();
      setToast({ message: "скопировано" });
    } catch {
      // Некоторые Telegram WebView (особенно старый Android) не дают доступ
      // к navigator.clipboard — не блокируем весь флоу молча из-за этого.
      setToast({ message: "не удалось скопировать", error: true });
    }
    api.copyPrompt(p.slug).catch(() => {});
  };

  return (
    <>
      <PromptLine
        section={group ? `prompts/${tab}/${group}` : `prompts/${tab}`}
        right={group ? <span onClick={() => setGroup(null)} style={{ cursor: "pointer" }}>✗ назад</span> : <span onClick={() => onNavigate("search")} style={{ cursor: "pointer" }}>🔍 поиск</span>}
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
            <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 14, marginTop: 0 }}>
              {groupLabel} ({groupPrompts.length})
            </p>
            {groupPrompts.length === 0 && <EmptyState />}
            {groupPrompts.map((p) => (
              <div
                key={p.slug}
                ref={p.slug === highlightSlug ? highlightRef : null}
                className="card"
                style={p.slug === highlightSlug ? { border: "1px solid var(--accent)" } : undefined}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <p className="card__title" style={{ margin: 0 }}>{p.title}</p>
                  <FavStar itemType="prompt" itemId={p.id} />
                </div>
                {p.comment && <p className="card__meta">{p.comment}</p>}
                <p style={{ color: "var(--text-body)", fontSize: 14, margin: "8px 0", whiteSpace: "pre-wrap" }}>
                  {p.body.length > 160 ? `${p.body.slice(0, 160)}…` : p.body}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            ))}
          </>
        )}
      </div>
      <Toast message={toast?.message} error={toast?.error} onDone={() => setToast(null)} />
    </>
  );
}
