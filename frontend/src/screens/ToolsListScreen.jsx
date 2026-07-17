import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { TOOLS_MENU, COMPONENTS_MENU } from "../config/menu";
import { api } from "../lib/api";
import { timeAgo } from "../lib/timeAgo";

const SORTS = [
  { id: "stars", label: "звёзды" },
  { id: "trending", label: "растущие" },
  { id: "new", label: "новое" },
];

function ComponentsSegment({ initial, onOpenComponent }) {
  const [compTab, setCompTab] = useState(initial?.tab || "agents");
  const [compGroup, setCompGroup] = useState(initial?.group || null);
  const [allComponents, setAllComponents] = useState(null); // для счётчиков групп
  const [groupComponents, setGroupComponents] = useState(null);
  const [error, setError] = useState(false);

  const loadAll = () => {
    setError(false);
    setAllComponents(null);
    api.components().then(setAllComponents).catch(() => setError(true));
  };

  useEffect(loadAll, []);
  useEffect(() => {
    if (!initial?.group) setCompGroup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compTab]);

  useEffect(() => {
    if (!compGroup || !allComponents) return;
    setGroupComponents(allComponents.filter((c) => c.comp_type === compTab && c.category === compGroup));
  }, [compGroup, compTab, allComponents]);

  const compSection = COMPONENTS_MENU.find((s) => s.slug === compTab);
  const counts = allComponents
    ? allComponents.reduce((acc, c) => {
        if (c.comp_type === compTab) acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {})
    : null;
  const groupLabel = compSection?.groups.find((g) => g.slug === compGroup)?.label;

  return (
    <>
      {!compGroup && <SectionTabs menu={COMPONENTS_MENU} active={compTab} onSelect={setCompTab} iconBase="/icons/components" />}
      <div className="page">
        {error && <ErrorState onRetry={compGroup ? () => setCompGroup(compGroup) : loadAll} />}
        {!error && !compGroup && !allComponents && <Spinner />}

        {allComponents && !compGroup && compSection && (
          <GroupList groups={compSection.groups} counts={counts} onOpen={setCompGroup} iconBase={`/icons/components/${compTab}`} />
        )}

        {compGroup && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 14 }}>
                {groupLabel}
              </span>
            </div>
            {!groupComponents && <Spinner />}
            {groupComponents && groupComponents.length === 0 && <EmptyState text="в этой группе пока пусто" />}
            {groupComponents?.map((c) => (
              <div key={c.slug} className="card" onClick={() => onOpenComponent(c.slug)} style={{ cursor: "pointer" }}>
                <p className="card__title">{c.title}</p>
                <p
                  style={{
                    color: "var(--text-body)", fontSize: 15, margin: "6px 0",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}
                >
                  {c.summary}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export function ToolsListScreen({ onOpenTool, onOpenComponent, onNavigate, initial }) {
  const [mode, setMode] = useState(initial?.mode === "components" ? "components" : "repos");
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
        section={mode === "components" ? "tools/components" : group ? `tools/${tab}/${group}` : `tools/${tab}`}
        right={group ? <span onClick={() => setGroup(null)} style={{ cursor: "pointer" }}>✗ назад</span> : <span onClick={() => onNavigate("search")} style={{ cursor: "pointer" }}>🔍 поиск</span>}
      />
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
        <div className={`chip ${mode === "repos" ? "chip--active" : ""}`} onClick={() => setMode("repos")} style={{ flex: 1, justifyContent: "center" }}>
          Репозитории
        </div>
        <div className={`chip ${mode === "components" ? "chip--active" : ""}`} onClick={() => setMode("components")} style={{ flex: 1, justifyContent: "center" }}>
          Компоненты
        </div>
      </div>

      {mode === "components" && (
        <ComponentsSegment initial={initial?.mode === "components" ? initial : undefined} onOpenComponent={onOpenComponent} />
      )}

      {mode === "repos" && (
        <>
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
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 14 }}>
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
                    <p style={{ color: "var(--text-body)", fontSize: 15, margin: "6px 0" }}>{t.description_ru}</p>
                    <p className="card__meta">
                      ⭐ {t.stars} {t.trending_delta > 0 && <span style={{ color: "var(--seg-what)" }}>▲ {t.trending_delta}</span>}
                      {t.last_commit && <span style={{ marginLeft: 8 }}>· {timeAgo(t.last_commit)}</span>}
                      {t.archived && <span style={{ color: "var(--seg-gotcha)", marginLeft: 8 }}>⚠ архивирован</span>}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
