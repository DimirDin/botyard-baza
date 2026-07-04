import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { Toast } from "../components/Toast";
import { PROMPTS_MENU } from "../config/menu";
import { api } from "../lib/api";
import { hapticSuccess } from "../lib/telegram";

export function PromptsListScreen() {
  const [tab, setTab] = useState("code");
  const [group, setGroup] = useState(null); // null = список групп
  const [prompts, setPrompts] = useState(null); // все промпты (одним запросом)
  const [error, setError] = useState(false);
  const [toast, setToast] = useState(null); // { message, error }

  const load = () => {
    setError(false);
    setPrompts(null);
    api.prompts().then(setPrompts).catch(() => setError(true));
  };

  useEffect(load, []);
  useEffect(() => setGroup(null), [tab]);

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
        right={group ? <span onClick={() => setGroup(null)} style={{ cursor: "pointer" }}>✗ назад</span> : null}
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
            <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
              {groupLabel} ({groupPrompts.length})
            </p>
            {groupPrompts.length === 0 && <EmptyState />}
            {groupPrompts.map((p) => (
              <div key={p.slug} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <p className="card__title" style={{ margin: 0 }}>{p.title}</p>
                  <FavStar itemType="prompt" itemId={p.id} />
                </div>
                {p.comment && <p className="card__meta">{p.comment}</p>}
                <p style={{ color: "var(--text-body)", fontSize: 13, margin: "8px 0", whiteSpace: "pre-wrap" }}>
                  {p.body.length > 160 ? `${p.body.slice(0, 160)}…` : p.body}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="card__meta">{p.copies_count} копирований</span>
                  <button
                    onClick={() => handleCopy(p)}
                    style={{
                      background: "var(--accent)", color: "#111110", border: "none", borderRadius: 4,
                      padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
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
