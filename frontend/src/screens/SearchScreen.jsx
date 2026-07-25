import { useEffect, useRef, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { EmptyState } from "../components/States";
import { api } from "../lib/api";
import { trackEvent } from "../lib/track";

const TYPE_LABEL = { entry: "статья", tool: "инструмент", prompt: "промпт", guide: "урок", component: "компонент" };

export function SearchScreen({ onOpenEntry, onOpenTool, onOpenPrompt, onOpenGuide, onOpenComponent }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const query = q.trim();
      api.search(query).then((res) => {
        setResults(res);
        const total =
          (res.entries?.length || 0) +
          (res.tools?.length || 0) +
          (res.prompts?.length || 0) +
          (res.guide?.length || 0) +
          (res.components?.length || 0);
        trackEvent("search", { q: query, results: total });
      }).catch(() => setResults(null));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const all = results ? [
    ...results.entries,
    ...results.tools,
    ...results.prompts,
    ...(results.guide || []),
    ...(results.components || []),
  ] : [];

  return (
    <>
      <AppHeader title="Поиск" />
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", marginBottom: 16 }}>
          <span style={{ color: "var(--accent)" }}>$</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="поиск по базе, инструментам, промптам..."
            style={{
              flex: 1, background: "transparent", border: "none", borderBottom: "1px solid var(--line)",
              color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, padding: "6px 0",
              outline: "none",
            }}
          />
          <span style={{ color: "var(--accent)" }}>▊</span>
        </div>

        {results && all.length === 0 && <EmptyState text="ничего не найдено" />}

        <div className="stack">
          {all.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              className="card"
              style={{ cursor: item.type === "prompt" ? "default" : "pointer" }}
              onClick={() => {
                if (item.type === "entry" && onOpenEntry) onOpenEntry(item.slug);
                else if (item.type === "tool" && onOpenTool) onOpenTool(item.repo.replace("/", "__"));
                else if (item.type === "prompt" && onOpenPrompt) onOpenPrompt(item.category, item.slug);
                else if (item.type === "guide" && onOpenGuide) onOpenGuide(item.level, item.slug);
                else if (item.type === "component" && onOpenComponent) onOpenComponent(item.slug);
              }}
            >
              <div className="card__pad">
                <span className="chip">{TYPE_LABEL[item.type]}</span>
                <p className="card__title">{item.title || item.name}</p>
                {item.summary && <p className="card__meta">{item.summary}</p>}
                {item.description_ru && <p className="card__meta">{item.description_ru}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
