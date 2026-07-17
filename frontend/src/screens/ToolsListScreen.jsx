import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { SectionTabs, GroupList } from "../components/SectionNav";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState, EmptyState } from "../components/States";
import { TOOLS_MENU } from "../config/menu";
import { api } from "../lib/api";
import { timeAgo } from "../lib/timeAgo";
import { hapticSuccess, openLink } from "../lib/telegram";

const SORTS = [
  { id: "stars", label: "звёзды" },
  { id: "trending", label: "растущие" },
  { id: "new", label: "новое" },
];

const COMP_TYPES = [
  { id: "all", label: "Все" },
  { id: "agents", label: "Агенты" },
  { id: "commands", label: "Команды" },
  { id: "mcps", label: "MCP" },
  { id: "hooks", label: "Хуки" },
  { id: "settings", label: "Настройки" },
  { id: "skills", label: "Скиллы" },
  { id: "loops", label: "Циклы" },
];

function ComponentsSegment({ highlightSlug }) {
  const [compType, setCompType] = useState("all");
  const [components, setComponents] = useState(null);
  const [error, setError] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    setError(false);
    setComponents(null);
    api.components().then(setComponents).catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!highlightSlug || !components) return;
    const el = document.getElementById(`cc-${highlightSlug}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightSlug, components]);

  const copyInstall = async (c) => {
    try {
      await navigator.clipboard.writeText(c.install_cmd);
      hapticSuccess();
      setCopiedSlug(c.slug);
      setTimeout(() => setCopiedSlug((s) => (s === c.slug ? null : s)), 1500);
    } catch {
      // буфер обмена недоступен (нет разрешения/не https) — тихо игнорируем, ссылка "Источник" всё равно рабочая
    }
  };

  const visible = components?.filter((c) => compType === "all" || c.comp_type === compType) ?? null;

  return (
    <div className="page">
      {error && <ErrorState onRetry={() => { setError(false); setComponents(null); api.components().then(setComponents).catch(() => setError(true)); }} />}
      {!error && !components && <Spinner />}

      {components && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {COMP_TYPES.map((t) => (
              <div key={t.id} className={`chip ${compType === t.id ? "chip--active" : ""}`} onClick={() => setCompType(t.id)}>
                {t.label}
              </div>
            ))}
          </div>

          {visible.length === 0 && <EmptyState text="в этой категории пока пусто" />}

          {visible.map((c) => (
            <div key={c.slug} id={`cc-${c.slug}`} className="card">
              <p className="card__title">{c.title}</p>
              <p style={{ color: "var(--text-body)", fontSize: 15, margin: "6px 0" }}>{c.summary}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <div className="chip" onClick={() => copyInstall(c)}>
                  {copiedSlug === c.slug ? "✓ скопировано" : "📋 копировать npx"}
                </div>
                <div className="chip" onClick={() => openLink(c.doc_url)}>
                  🔗 источник
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function ToolsListScreen({ onOpenTool, onNavigate, initial }) {
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
      {!group && (
        <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
          <div className={`chip ${mode === "repos" ? "chip--active" : ""}`} onClick={() => setMode("repos")} style={{ flex: 1, justifyContent: "center" }}>
            Репозитории
          </div>
          <div className={`chip ${mode === "components" ? "chip--active" : ""}`} onClick={() => setMode("components")} style={{ flex: 1, justifyContent: "center" }}>
            Компоненты
          </div>
        </div>
      )}

      {mode === "components" && !group && <ComponentsSegment highlightSlug={initial?.slug} />}

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
