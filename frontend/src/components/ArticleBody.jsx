import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export function ArticleBody({ bodyMd }) {
  const sections = splitSections(bodyMd);

  return (
    <div className="article-body">
      {sections.map((section, i) => {
        const isGotcha = section.header?.label === "грабли";
        const content = (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body.join("\n")}</ReactMarkdown>
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
