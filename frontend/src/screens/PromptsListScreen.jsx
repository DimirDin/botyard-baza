import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { Toast } from "../components/Toast";
import { api } from "../lib/api";
import { hapticSuccess } from "../lib/telegram";

export function PromptsListScreen() {
  const [prompts, setPrompts] = useState(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState(null);
  const [toast, setToast] = useState(null); // { message, error }

  const load = () => {
    setError(false);
    setPrompts(null);
    api.prompts(category).then(setPrompts).catch(() => setError(true));
  };

  useEffect(load, [category]);

  const categories = prompts ? [...new Set(prompts.map((p) => p.category))] : [];

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
      <PromptLine section="prompts" />
      <div className="page">
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div className={`chip ${!category ? "chip--active" : ""}`} onClick={() => setCategory(null)}>все</div>
            {categories.map((c) => (
              <div key={c} className={`chip ${category === c ? "chip--active" : ""}`} onClick={() => setCategory(c)}>
                {c}
              </div>
            ))}
          </div>
        )}

        {error && <ErrorState onRetry={load} />}
        {!error && !prompts && <Spinner />}
        {prompts && prompts.length === 0 && <EmptyState />}

        {prompts?.map((p) => (
          <div key={p.slug} className="card">
            <p className="card__title">{p.title}</p>
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
      </div>
      <Toast message={toast?.message} error={toast?.error} onDone={() => setToast(null)} />
    </>
  );
}
