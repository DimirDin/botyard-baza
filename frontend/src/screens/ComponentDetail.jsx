import { useEffect, useState } from "react";
import { PromptLine } from "../components/PromptLine";
import { Spinner, ErrorState } from "../components/States";
import { api } from "../lib/api";
import { hapticSuccess, openLink } from "../lib/telegram";

const TYPE_LABEL = {
  agents: "агент", commands: "команда", mcps: "MCP-сервер",
  hooks: "хук", settings: "настройка", skills: "скилл", loops: "агентный цикл",
};

export function ComponentDetail({ slug, onBack }) {
  const [component, setComponent] = useState(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setError(false);
    setComponent(null);
    api.component(slug).then(setComponent).catch(() => setError(true));
  };

  useEffect(load, [slug]);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(component.install_cmd);
      hapticSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен — тихо игнорируем
    }
  };

  return (
    <>
      <PromptLine
        section={component ? `tools/components/${component.slug}` : "tools/components"}
        right={onBack ? <span onClick={onBack} style={{ cursor: "pointer" }}>✗ назад</span> : null}
      />
      <div className="page">
        {error && <ErrorState onRetry={load} />}
        {!error && !component && <Spinner />}
        {component && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <h1 style={{ color: "var(--text-heading)", fontSize: 22, marginTop: 0 }}>{component.title}</h1>
              <span className="chip">{TYPE_LABEL[component.comp_type] || component.comp_type}</span>
            </div>
            <p style={{ fontSize: 17, color: "var(--text-body)", marginTop: 0 }}>{component.summary}</p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <div className="chip" onClick={copyInstall}>
                {copied ? "✓ скопировано" : "📋 копировать npx"}
              </div>
              <div className="chip" onClick={() => openLink(component.doc_url)}>
                🔗 источник
              </div>
            </div>

            {component.body_md && (
              <details className="raw-source">
                <summary className="raw-source__summary">Показать оригинальный исходник (EN)</summary>
                <pre className="raw-source__pre"><code>{component.body_md}</code></pre>
              </details>
            )}
          </>
        )}
      </div>
    </>
  );
}
