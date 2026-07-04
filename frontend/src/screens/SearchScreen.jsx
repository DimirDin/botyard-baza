import { useEffect, useRef, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { EmptyState } from "../components/States";
import { api } from "../lib/api";

const TYPE_ICON = { entry: "📚", tool: "🛠", prompt: "⚡" };

export function SearchScreen({ onOpenEntry }) {
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
      api.search(q).then(setResults).catch(() => setResults(null));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const all = results ? [...results.entries, ...results.tools, ...results.prompts] : [];

  return (
    <>
      <PromptLine section="search" />
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", marginBottom: 16 }}>
          <span style={{ color: "var(--accent)" }}>$</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="поиск по базе, инструментам, промптам..."
            style={{
              flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #26261f",
              color: "var(--text-heading)", fontFamily: "var(--font-mono)", fontSize: 14, padding: "6px 0",
              outline: "none",
            }}
          />
          <span style={{ color: "var(--accent)" }}>▊</span>
        </div>

        {results && all.length === 0 && <EmptyState text="ничего не найдено" />}

        {all.map((item, i) => (
          <div
            key={`${item.type}-${i}`}
            className="card"
            style={{ cursor: item.type === "entry" ? "pointer" : "default" }}
            onClick={() => item.type === "entry" && onOpenEntry(item.slug)}
          >
            <span className="card__meta">{TYPE_ICON[item.type]} {item.type}</span>
            <p className="card__title">{item.title || item.name}</p>
            {item.summary && <p className="card__meta">{item.summary}</p>}
            {item.description_ru && <p className="card__meta">{item.description_ru}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
