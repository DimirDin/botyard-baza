import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";

export function HomeScreen({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setData(null);
    api.home().then(setData).catch(() => setError(true));
  };

  useEffect(load, []);

  return (
    <>
      <PromptLine section="home" />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !data && <Spinner />}
        {data && (
          <>
            <section style={{ marginBottom: 24 }}>
              <span className="segment-label segment-label--why">новое на неделе</span>
              {data.recent_entries.length === 0 && <p style={{ color: "var(--text-muted)" }}>пока пусто</p>}
              {data.recent_entries.map((e) => (
                <div key={e.slug} className="card" onClick={() => onNavigate("entry", e.slug)} style={{ cursor: "pointer" }}>
                  <p className="card__title">{e.title}</p>
                  <p className="card__meta">обновлено {e.updated_at?.slice(0, 10)}</p>
                </div>
              ))}
            </section>

            <section style={{ marginBottom: 24 }}>
              <span className="segment-label segment-label--example">топ промптов</span>
              {data.top_prompts.map((p) => (
                <div key={p.slug} className="card" onClick={() => onNavigate("prompts")} style={{ cursor: "pointer" }}>
                  <p className="card__title">{p.title}</p>
                  <p className="card__meta">{p.copies_count} копирований</p>
                </div>
              ))}
            </section>

            <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="chip" onClick={() => onNavigate("base")}>📚 {data.counts.entries_count} статей</div>
              <div className="chip" onClick={() => onNavigate("tools")}>🛠 {data.counts.tools_count} инструментов</div>
              <div className="chip" onClick={() => onNavigate("prompts")}>⚡ {data.counts.prompts_count} промптов</div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
