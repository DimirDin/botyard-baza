import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { BASE_MENU } from "../config/menu";
import { api } from "../lib/api";

export function EntriesListScreen({ onOpenEntry }) {
  const [tab, setTab] = useState("code");
  const [group, setGroup] = useState(null); // null = список групп
  const [entries, setEntries] = useState(null); // все статьи секции
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setEntries(null);
    api.entries(tab).then(setEntries).catch(() => setError(true));
  };

  useEffect(() => {
    setGroup(null);
    load();
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
            <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
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
