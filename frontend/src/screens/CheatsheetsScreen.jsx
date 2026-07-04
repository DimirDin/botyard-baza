import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PromptLine } from "../components/PromptLine";
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
        <PromptLine section="cheat" right={<span onClick={() => setCurrent(null)} style={{ cursor: "pointer" }}>✗ закрыть</span>} />
        <div className="page">
          <h1 style={{ color: "var(--text-heading)", fontSize: 20, marginTop: 0 }}>{current.title}</h1>
          <div className="article-body cheatsheet-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.body_md}</ReactMarkdown>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PromptLine section="cheat" />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !list && <Spinner />}
        {current === "loading" && <Spinner />}
        {list && list.length === 0 && <EmptyState />}

        {list?.map((c, i) => (
          <div key={c.slug} className="card" onClick={() => open(c.slug)} style={{ cursor: "pointer" }}>
            <span className="tree-item">{i === list.length - 1 ? "└──" : "├──"}</span>
            <span className="card__title">{c.title}</span>
            <p className="card__meta" style={{ marginTop: 4 }}>{c.category}</p>
          </div>
        ))}
      </div>
    </>
  );
}
