import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { TOOLS_MENU } from "../config/menu";
import { api } from "../lib/api";

const SORTS = [
  { id: "stars", label: "звёзды" },
  { id: "trending", label: "растущие" },
  { id: "new", label: "новое" },
];

export function ToolsListScreen({ onOpenTool }) {
  const [tab, setTab] = useState("mcp");
  const [group, setGroup] = useState(null);
  const [sort, setSort] = useState("stars");
  const [allTools, setAllTools] = useState(null); // для счётчиков групп
  const [groupTools, setGroupTools] = useState(null); // текущая группа с сортировкой
  const [error, setError] = useState(false);

  const loadAll = () => {
    setError(false);
    setAllTools(null);
    api.tools().then(setAllTools).catch(() => setError(true));
  };

  useEffect(loadAll, []);
  useEffect(() => setGroup(null), [tab]);

  useEffect(() => {
    if (!group) return;
    setGroupTools(null);
    api.tools(`${tab}/${group}`, sort).then(setGroupTools).catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, sort]);

  const section = TOOLS_MENU.find((s) => s.slug === tab);
  const counts = allTools
    ? allTools.reduce((acc, t) => {
        const [cTab, cGroup] = (t.category || "").split("/");
        if (cTab === tab && cGroup) acc[cGroup] = (acc[cGroup] || 0) + 1;
        return acc;
      }, {})
    : null;
  const groupLabel = section?.groups.find((g) => g.slug === group)?.label;

  return (
    <>
      <PromptLine
        section={group ? `tools/${tab}/${group}` : `tools/${tab}`}
        right={group ? <span onClick={() => setGroup(null)} style={{ cursor: "pointer" }}>✗ назад</span> : null}
      />
      {!group && <SectionTabs menu={TOOLS_MENU} active={tab} onSelect={setTab} iconBase="/icons/tools" />}
      <div className="page">
        {error && <ErrorState onRetry={group ? () => setGroup(group) : loadAll} />}
        {!error && !group && !allTools && <Spinner />}

        {allTools && !group && (
          <GroupList groups={section.groups} counts={counts} onOpen={setGroup} iconBase={`/icons/tools/${tab}`} />
        )}

        {group && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 13 }}>
                {groupLabel}
              </span>
              {SORTS.map((s) => (
                <div key={s.id} className={`chip ${sort === s.id ? "chip--active" : ""}`} onClick={() => setSort(s.id)}>
                  {s.label}
                </div>
              ))}
            </div>
            {!groupTools && <Spinner />}
            {groupTools && groupTools.length === 0 && <EmptyState text="в этой группе пока пусто" />}
            {groupTools?.map((t) => (
              <div
                key={t.repo}
                className="card"
                onClick={() => onOpenTool(t.repo.replace("/", "__"))}
                style={{ cursor: "pointer" }}
              >
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
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
