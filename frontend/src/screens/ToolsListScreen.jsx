import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { api } from "../lib/api";

const SORTS = [
  { id: "stars", label: "звёзды" },
  { id: "trending", label: "растущие" },
  { id: "new", label: "новое" },
];

export function ToolsListScreen() {
  const [tools, setTools] = useState(null);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState("stars");
  const [category, setCategory] = useState(null);

  const load = () => {
    setError(false);
    setTools(null);
    api.tools(category, sort).then(setTools).catch(() => setError(true));
  };

  useEffect(load, [sort, category]);

  const categories = tools ? [...new Set(tools.map((t) => t.category))] : [];

  return (
    <>
      <PromptLine section="tools" />
      <div className="page">
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {SORTS.map((s) => (
            <div key={s.id} className={`chip ${sort === s.id ? "chip--active" : ""}`} onClick={() => setSort(s.id)}>
              {s.label}
            </div>
          ))}
        </div>

        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div className={`chip ${!category ? "chip--active" : ""}`} onClick={() => setCategory(null)}>все категории</div>
            {categories.map((c) => (
              <div key={c} className={`chip ${category === c ? "chip--active" : ""}`} onClick={() => setCategory(c)}>
                {c}
              </div>
            ))}
          </div>
        )}

        {error && <ErrorState onRetry={load} />}
        {!error && !tools && <Spinner />}
        {tools && tools.length === 0 && <EmptyState text="инструментов пока нет — ждём GitHub-синк звёзд" />}

        {tools?.map((t) => (
          <a key={t.repo} className="card" href={`https://github.com/${t.repo}`} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <p className="card__title">{t.name}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t.badge === "editors_choice" && <span className="chip chip--editors">выбор редакции</span>}
                <FavStar itemType="tool" itemId={t.id} />
              </span>
            </div>
            <p style={{ color: "var(--text-body)", fontSize: 14, margin: "6px 0" }}>{t.description_ru}</p>
            <p className="card__meta">
              ⭐ {t.stars} {t.trending_delta > 0 && <span style={{ color: "var(--seg-what)" }}>▲ {t.trending_delta}</span>}
              {t.archived && <span style={{ color: "var(--seg-gotcha)", marginLeft: 8 }}>⚠ архивирован</span>}
            </p>
          </a>
        ))}
      </div>
    </>
  );
}
