// Локальная имитация backend — только для разработки экранов без реального Telegram
// initData (см. .env.development). Никогда не активна в проде: VITE_USE_MOCK задан
// только в .env.development, который Vite не подхватывает в `vite build`/prod-режиме.
export const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "1";

const entries = [
  { id: 1, slug: "cc-slash-commands", section: "code", group_slug: "claude-code", title: "Слэш-команды Claude Code", summary: "Встроенные /-команды и как добавить свои.", tags: ["cli"], updated_at: "2026-07-01" },
  { id: 2, slug: "cc-claude-md-config", section: "code", group_slug: "claude-md", title: "CLAUDE.md: конфигурация проекта", summary: "Что писать в CLAUDE.md и как это влияет на поведение.", tags: ["config"], updated_at: "2026-06-20" },
  { id: 3, slug: "con-cyrillic-tokenization", section: "theory", group_slug: "tokenization", title: "Токенизация кириллицы", summary: "Почему русский текст стоит дороже английского.", tags: ["tokenization"], updated_at: "2026-06-15" },
];

const entryBody = {
  id: 3,
  slug: "con-cyrillic-tokenization",
  section: "concepts",
  title: "Токенизация кириллицы: почему русский язык стоит дороже",
  doc_url: "https://docs.claude.com/en/docs_site_map.md",
  updated_at: "2026-06-15",
  body_md:
    "### ❓ Что это\nТокенайзер Claude бьёт текст на subword-токены по BPE.\n\n" +
    "### 🎯 Зачем тебе\nРусский текст генерирует заметно больше токенов, чем английский.\n\n" +
    "### 💻 Минимальный пример\n`development` → 1 токен, `разработка` → 4 токена.\n\n" +
    "### ⚠️ Грабли\nСистемные промпты и JSON-схемы пиши на английском — экономит бюджет.\n\n" +
    "### 🔗 Первоисточник\nAnthropic API Docs — Multilingual Tokenization",
};

const tools = [
  { id: 1, repo: "anthropics/claude-code", name: "claude-code", category: "apps/desktop", description_ru: "Официальный CLI-агент для разработки в терминале.", badge: "editors_choice", stars: 15234, trending_delta: 320, archived: false },
  { id: 2, repo: "some/mcp-server", name: "mcp-server-fs", category: "mcp/servers", description_ru: "MCP-сервер для доступа к файловой системе.", badge: null, stars: 890, trending_delta: 12, archived: false },
];

const prompts = [
  { id: 1, slug: "code-review-strict", category: "review/pr-review", title: "Строгий код-ревью", body: "Проверь этот diff на баги, забытые edge-cases и небезопасный код...", comment: "Перед мержем в main", copies_count: 142 },
  { id: 2, slug: "ru-en-compress", category: "content/compress", title: "RU→EN компрессия контекста", body: "Переведи системные инструкции на английский, сохранив смысл...", comment: "Экономия токенов в системном промпте", copies_count: 98 },
];


const cheatsheets = [
  { slug: "cheat-cc-slash", title: "Slash-команды Claude Code", category: "code", sort_order: 10,
    body_md: "| Команда | Что делает |\n|---|---|\n| /help | справка |\n| /clear | очистить контекст |" },
  { slug: "cheat-api-limits-models", title: "Модели, лимиты и коды ошибок API", category: "api", sort_order: 30,
    body_md: "| Модель | Контекст |\n|---|---|\n| Sonnet 5 | 1M |" },
];

let mockFavorites = [{ item_type: "entry", item_id: 3 }];

export async function mockFetch(path, options = {}) {
  await new Promise((r) => setTimeout(r, 250));

  if (path === "/gate/check" || path === "/gate/recheck") return { subscribed: true, user: { tg_id: 1, username: "dev" } };
  if (path === "/home") {
    return {
      counts: { entries_count: 30, tools_count: 18, prompts_count: 33 },
      top_prompts: prompts.map((p) => ({ slug: p.slug, title: p.title, copies_count: p.copies_count })),
      recent_entries: entries.map((e) => ({ slug: e.slug, title: e.title, updated_at: e.updated_at })),
    };
  }
  if (path === "/favorites/ids") return mockFavorites.map((f) => `${f.item_type}:${f.item_id}`);
  if (path === "/favorites/toggle") {
    const body = JSON.parse(options.body || "{}");
    const i = mockFavorites.findIndex((f) => f.item_type === body.item_type && f.item_id === body.item_id);
    if (i >= 0) { mockFavorites.splice(i, 1); return { favorited: false }; }
    mockFavorites.push(body);
    return { favorited: true };
  }
  if (path === "/favorites") {
    return mockFavorites.map((f) => {
      const src = f.item_type === "entry" ? entries : f.item_type === "tool" ? tools : prompts;
      const item = src.find((x) => x.id === f.item_id);
      return item && {
        item_type: f.item_type, item_id: f.item_id,
        title: item.title || item.name, subtitle: item.summary || item.description_ru || item.comment,
        entry_slug: f.item_type === "entry" ? item.slug : null,
        prompt_slug: f.item_type === "prompt" ? item.slug : null,
        tool_repo: f.item_type === "tool" ? item.repo : null,
      };
    }).filter(Boolean);
  }
  if (path.startsWith("/cheatsheets/")) return cheatsheets.find((c) => path.endsWith(c.slug)) || cheatsheets[0];
  if (path.startsWith("/cheatsheets")) return cheatsheets.map(({ body_md, ...rest }) => rest);
  if (path.startsWith("/entries/")) return entryBody;
  if (path.startsWith("/entries")) {
    const q = new URLSearchParams(path.split("?")[1] || "");
    return entries.filter((e) =>
      (!q.get("section") || e.section === q.get("section")) &&
      (!q.get("group") || e.group_slug === q.get("group")));
  }
  if (path.startsWith("/tools")) {
    const q = new URLSearchParams(path.split("?")[1] || "");
    return tools.filter((t) => !q.get("category") || t.category === q.get("category"));
  }
  if (path.startsWith("/prompts") && options.method === "POST") return { copies_count: 143 };
  if (path.startsWith("/prompts")) return prompts;
  if (path.startsWith("/search")) {
    const q = new URLSearchParams(path.split("?")[1]).get("q") || "";
    return {
      entries: entries.filter((e) => e.title.toLowerCase().includes(q.toLowerCase())).map((e) => ({ ...e, type: "entry" })),
      tools: tools.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())).map((t) => ({ ...t, type: "tool" })),
      prompts: prompts.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())).map((p) => ({ ...p, type: "prompt" })),
    };
  }
  if (path.startsWith("/calc/tokens")) {
    const body = JSON.parse(options.body || "{}");
    const tokens = Math.round((body.text || "").length / 3.2);
    return { tokens, approx: true, tokenizer_note: "Оценка через tiktoken — не официальный токенайзер Claude.", cost_estimate_usd: +(tokens / 1_000_000 * 3).toFixed(6), model_tokenizer_note: null };
  }
  return {};
}
