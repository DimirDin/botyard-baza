import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { ArticleBody } from "../components/ArticleBody";
import { FavStar } from "../components/FavStar";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { timeAgo } from "../lib/timeAgo";
import { shareLink } from "../lib/telegram";
import { trackEvent } from "../lib/track";

export function ToolDetail({ slug, onBack }) {
  const [tool, setTool] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setTool(null);
    api.tool(slug).then(setTool).catch(() => setError(true));
  };

  useEffect(load, [slug]);

  useEffect(() => {
    if (tool) trackEvent("view_tool", { repo: tool.repo, name: tool.name, category: tool.category });
  }, [tool]);

  return (
    <>
      <PromptLine
        section={tool ? `tools/${tool.repo}` : "tools"}
        right={onBack ? <span onClick={onBack} style={{ cursor: "pointer" }}>✗ назад</span> : null}
      />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !tool && <Spinner />}
        {tool && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0 }}>{tool.name}</h1>
              {tool.badge === "editors_choice" && <span className="chip chip--editors" style={{ flexShrink: 0 }}>выбор редакции</span>}
            </div>
            <div style={{ marginTop: 8, marginBottom: 4, display: "flex", flexWrap: "wrap", rowGap: 4, columnGap: 12, alignItems: "center" }}>
              <FavStar itemType="tool" itemId={tool.id} />
              <span className="card__meta">⭐ {tool.stars}</span>
              {tool.trending_delta > 0 && (
                <span className="card__meta" style={{ color: "var(--seg-what)" }}>▲ {tool.trending_delta} за неделю</span>
              )}
              {tool.last_commit && <span className="card__meta">{timeAgo(tool.last_commit)}</span>}
            </div>

            {tool.body_md ? (
              <ArticleBody bodyMd={tool.body_md} />
            ) : (
              <>
                <p style={{ fontSize: 17, color: "var(--text-body)" }}>{tool.description_ru}</p>
                <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted-dim)", fontSize: 14 }}>
                  # TODO: подробное описание в разработке
                </p>
              </>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href={`https://github.com/${tool.repo}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  padding: "8px 16px",
                  background: "transparent",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Открыть репозиторий →
              </a>
              <button
                onClick={() => shareLink(`https://t.me/bazadry_bot?start=tool_${tool.repo.replace("/", "__")}`, tool.name)}
                style={{
                  marginTop: 16, padding: "8px 16px", background: "transparent", color: "var(--accent)",
                  border: "1px solid var(--accent)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 14,
                }}
              >
                ↗ поделиться
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
