import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppHeader } from "../components/AppHeader";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { api } from "../lib/api";

export function CheatsheetsScreen() {
  const [list, setList] = useState(null);
  const [current, setCurrent] = useState(null); // открытая шпаргалка (с body_md)
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setList(null);
    api.cheatsheets().then(setList).catch(() => setError(true));
  };

  useEffect(load, []);

  const open = (slug) => {
    setCurrent("loading");
    api.cheatsheet(slug).then(setCurrent).catch(() => setCurrent(null));
  };

  if (current && current !== "loading") {
    return (
      <>
        <AppHeader
          title="Шпаргалки"
          action={<button className="icon-btn" onClick={() => setCurrent(null)}>закрыть</button>}
        />
        <div className="page">
          <h1 style={{ color: "var(--text)", fontSize: 22, marginTop: 0 }}>{current.title}</h1>
          <div className="sheet article-body cheatsheet-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.body_md}</ReactMarkdown>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Шпаргалки" />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !list && <Spinner />}
        {current === "loading" && <Spinner />}
        {list && list.length === 0 && <EmptyState />}

        <div className="stack">
          {list?.map((c) => (
            <div key={c.slug} className="card" onClick={() => open(c.slug)}>
              <div className="card__pad">
                <span className="card__title">{c.title}</span>
                <p className="card__meta">{c.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
