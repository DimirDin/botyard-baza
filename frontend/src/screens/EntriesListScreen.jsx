import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { api } from "../lib/api";

const SECTION_LABELS = { code: "Claude Code", chat: "Claude.ai", api: "API", concepts: "Концепты" };

export function EntriesListScreen({ onOpenEntry }) {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(false);
  const [section, setSection] = useState(null);

  const load = () => {
    setError(false);
    setEntries(null);
    api.entries(section).then(setEntries).catch(() => setError(true));
  };

  useEffect(load, [section]);

  const grouped = entries
    ? entries.reduce((acc, e) => {
        (acc[e.section] ||= []).push(e);
        return acc;
      }, {})
    : {};

  return (
    <>
      <PromptLine section="base" />
      <div className="page">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div className={`chip ${!section ? "chip--active" : ""}`} onClick={() => setSection(null)}>все</div>
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <div key={key} className={`chip ${section === key ? "chip--active" : ""}`} onClick={() => setSection(key)}>
              {label}
            </div>
          ))}
        </div>

        {error && <ErrorState onRetry={load} />}
        {!error && !entries && <Spinner />}
        {entries && entries.length === 0 && <EmptyState />}

        {Object.entries(grouped).map(([sec, items]) => (
          <div key={sec} style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 13 }}>
              {SECTION_LABELS[sec] || sec} ({items.length})
            </p>
            {items.map((e) => (
              <div key={e.slug} className="card" onClick={() => onOpenEntry(e.slug)} style={{ cursor: "pointer" }}>
                <span className="tree-item">├──</span>
                <span className="card__title">{e.title}</span>
                <p className="card__meta" style={{ marginTop: 4 }}>{e.summary}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
