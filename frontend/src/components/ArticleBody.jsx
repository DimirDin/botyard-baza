import React from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "./Mermaid";

// Заголовки в content/entries/*.md — эмодзи-префиксы. Оформление статей (§14)
// требует заменить их на цветные powerline-лейблы, а не показывать как есть.
// Инструменты (content/tools.yaml → body_md) используют свой набор заголовков
// (Для чего / Как установить / Как пользоваться) — цвета переиспользуются те же (§13).
const HEADER_MAP = [
  { match: "❓ Что это", label: "что это", cls: "segment-label--what" },
  { match: "🎯 Зачем тебе", label: "зачем тебе", cls: "segment-label--why" },
  { match: "🎯 Для чего", label: "для чего", cls: "segment-label--why" },
  { match: "💻 Минимальный пример", label: "пример", cls: "segment-label--example" },
  { match: "💻 Как установить", label: "как установить", cls: "segment-label--example" },
  { match: "🚀 Как пользоваться", label: "как пользоваться", cls: "segment-label--example" },
  { match: "⚠️ Грабли", label: "грабли", cls: "segment-label--gotcha" },
  { match: "🔗 Первоисточник", label: "источник", cls: "segment-label--source" },
  // Гид (content/guide/*.md) использует свой набор заголовков — тот же цветовой код.
  { match: "💻 Как это выглядит на практике", label: "на практике", cls: "segment-label--example" },
  { match: "⚠️ Частая ошибка новичка", label: "частая ошибка", cls: "segment-label--gotcha" },
  { match: "🔗 Официальный источник", label: "источник", cls: "segment-label--source" },
  // Новая секция лонгридов Гида (редизайн 2026-07) — инлайн-кросс-ссылки на Базу/Софт/Промпты.
  { match: "🔗 Смотри в приложении", label: "смотри в приложении", cls: "segment-label--example" },
];

function splitSections(md) {
  const lines = md.split("\n");
  const sections = [];
  let current = { header: null, body: [] };

  for (const line of lines) {
    const headerLine = /^###\s+(.*)$/.exec(line.trim());
    const known = headerLine && HEADER_MAP.find((h) => headerLine[1].includes(h.match));
    if (known) {
      if (current.header || current.body.length) sections.push(current);
      current = { header: known, body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.header || current.body.length) sections.push(current);
  return sections;
}

// Ссылки вида [текст](entry:slug) / (tool:owner/repo) / (prompt:slug) — внутренняя навигация
// по мини-аппу вместо ухода во внешний браузер (план редизайна Гида). Обычные http(s)-ссылки
// рендерятся как есть, поведение не менялось.
const INTERNAL_LINK_RE = /^(entry|tool|prompt):(.+)$/;

// react-markdown по умолчанию санитизирует нестандартные URL-схемы (обнуляет href) —
// пропускаем entry:/tool:/prompt: как есть, остальное отдаём дефолтной проверке безопасности.
function urlTransform(url) {
  return INTERNAL_LINK_RE.test(url) ? url : defaultUrlTransform(url);
}

function makeLinkRenderer(onNavigate) {
  return function InternalLink({ href, children }) {
    const match = INTERNAL_LINK_RE.exec(href || "");
    if (!match || !onNavigate) {
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    const [, kind, ref] = match;
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(kind, ref);
        }}
        style={{ color: "var(--accent)", cursor: "pointer" }}
      >
        {children}
      </a>
    );
  };
}

export function ArticleBody({ bodyMd, onNavigate }) {
  if (!bodyMd) return null;
  const sections = splitSections(bodyMd);
  const components = {
    a: makeLinkRenderer(onNavigate),
    pre(props) {
      const { children, ...rest } = props;
      const hasMermaid = React.Children.toArray(children).some(
        (child) =>
          child &&
          child.props &&
          child.props.className &&
          child.props.className.includes("language-mermaid")
      );
      if (hasMermaid) {
        return <>{children}</>;
      }
      return <pre {...rest}>{children}</pre>;
    },
    code(props) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      
      if (language === "mermaid") {
        const chartCode = String(children).replace(/\n$/, "");
        return <Mermaid chart={chartCode} onNavigate={onNavigate} />;
      }
      
      return <code className={className} {...rest}>{children}</code>;
    }
  };

  return (
    <div className="article-body">
      {sections.map((section, i) => {
        const isGotcha = section.header?.label === "грабли";
        const content = (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
            {section.body.join("\n")}
          </ReactMarkdown>
        );
        return (
          <div key={i} style={{ marginBottom: 20 }}>
            {section.header && (
              <span className={`segment-label ${section.header.cls}`}>{section.header.label}</span>
            )}
            {isGotcha ? <div className="gotcha-block">{content}</div> : content}
          </div>
        );
      })}
    </div>
  );
}
