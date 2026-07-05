import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { BASE_MENU } from "../config/menu";
import { api } from "../lib/api";

export function EntriesListScreen({ initial, onOpenEntry }) {
  const [tab, setTab] = useState(() => initial?.tab || "code");
  const [group, setGroup] = useState(null); // null = список групп
  const [entries, setEntries] = useState(null); // все статьи секции
  const [error, setError] = useState(false);

  // Шпаргалки (tab === "cheat") — отдельная таблица/эндпоинт (baza.cheatsheets),
  // не content/entries, поэтому не участвуют в group_slug-группировке ниже.
  const [cheatList, setCheatList] = useState(null);
  const [cheatCurrent, setCheatCurrent] = useState(null);
  const isCheat = tab === "cheat";

  const load = () => {
    setError(false);
    setEntries(null);
    api.entries(tab).then(setEntries).catch(() => setError(true));
  };

  const loadCheat = () => {
    setError(false);
    setCheatList(null);
    setCheatCurrent(null);
    api.cheatsheets().then(setCheatList).catch(() => setError(true));
  };

  const openCheat = (slug) => {
    setCheatCurrent("loading");
    api.cheatsheet(slug).then(setCheatCurrent).catch(() => setCheatCurrent(null));
  };

  useEffect(() => {
    setGroup(null);
    if (isCheat) loadCheat();
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const section = BASE_MENU.find((s) => s.slug === tab);
  const counts = entries
    ? entries.reduce((acc, e) => {
        if (e.group_slug) acc[e.group_slug] = (acc[e.group_slug] || 0) + 1;
        return acc;
      }, {})
    : null;
  const groupEntries = group && entries ? entries.filter((e) => e.group_slug === group) : [];
  const groupLabel = section?.groups.find((g) => g.slug === group)?.label;

  if (isCheat) {
    if (cheatCurrent && cheatCurrent !== "loading") {
      return (
        <>
          <PromptLine section="base/cheat" right={<span onClick={() => setCheatCurrent(null)} style={{ cursor: "pointer" }}>✗ назад</span>} />
          <div className="page">
            <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0 }}>{cheatCurrent.title}</h1>
            <div className="article-body cheatsheet-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{cheatCurrent.body_md}</ReactMarkdown>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <PromptLine section="base/cheat" />
        <SectionTabs menu={BASE_MENU} active={tab} onSelect={setTab} iconBase="/icons/base" />
        <div className="page">
          {error && <ErrorState onRetry={loadCheat} />}
          {!error && !cheatList && <Spinner />}
          {cheatCurrent === "loading" && <Spinner />}
          {cheatList && cheatList.length === 0 && <EmptyState />}

          {cheatList?.map((c, i) => (
            <div key={c.slug} className="card" onClick={() => openCheat(c.slug)} style={{ cursor: "pointer" }}>
              <span className="tree-item">{i === cheatList.length - 1 ? "└──" : "├──"}</span>
              <span className="card__title">{c.title}</span>
              <p className="card__meta" style={{ marginTop: 4 }}>{c.category}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PromptLine
        section={group ? `base/${tab}/${group}` : `base/${tab}`}
        right={group ? <span onClick={() => setGroup(null)} style={{ cursor: "pointer" }}>✗ назад</span> : null}
      />
      {!group && <SectionTabs menu={BASE_MENU} active={tab} onSelect={setTab} iconBase="/icons/base" />}
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !entries && <Spinner />}

        {entries && !group && (
          <GroupList groups={section.groups} counts={counts} onOpen={setGroup} iconBase={`/icons/base/${tab}`} />
        )}

        {group && (
          <>
            <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 14, marginTop: 0 }}>
              {groupLabel} ({groupEntries.length})
            </p>
            {groupEntries.length === 0 && <EmptyState />}
            {groupEntries.map((e) => (
              <div key={e.slug} className="card" onClick={() => onOpenEntry(e.slug)} style={{ cursor: "pointer" }}>
                <span className="card__title">{e.title}</span>
                <p className="card__meta" style={{ marginTop: 4 }}>{e.summary}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
