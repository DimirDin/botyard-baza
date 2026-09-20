import { getInitData } from "./telegram";
import { mockFetch, USE_MOCK } from "./mock";

const BASE = import.meta.env.VITE_API_BASE || "/api";

// Глобальный перехват отказов авторизации.
//
// Гейт проверяется один раз при старте (App.jsx), а дальше каждая ручка может
// вернуть 401 или 403 в середине сессии, и до этого перехватчика такой ответ
// нигде не обрабатывался — экраны просто переставали грузиться без объяснений:
//   401 — initData протух. Telegram подписывает его при запуске, backend
//         отвергает старше часа (gate.py). Человек, читавший статью час,
//         получал набор пустых экранов.
//   403 — initData валиден, но подписки больше нет (отписался, пока читал).
//         Правильная реакция — вернуть на гейт, а не молчать.
//
// Перезагрузка страницы от 401 НЕ спасает: initData лежит в параметрах запуска
// WebView и при reload будет тем же самым, уже просроченным. Свежий initData
// выдаётся только при новом открытии приложения — поэтому обработчик наверху
// показывает экран с просьбой переоткрыть, а не дёргает location.reload().
let authErrorHandler = null;

export function setAuthErrorHandler(fn) {
  authErrorHandler = fn;
}

async function request(path, options = {}) {
  if (USE_MOCK) return mockFetch(path, options);

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": getInitData(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail ? JSON.stringify(body.detail) : `HTTP ${res.status}`);
    err.status = res.status;
    // Сообщаем наверх до броска: вызывающий код часто глушит ошибку своим catch,
    // и без этого протухшая сессия так и осталась бы незамеченной.
    if ((res.status === 401 || res.status === 403) && authErrorHandler) {
      authErrorHandler(res.status);
    }
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Витрина до гейта — единственные ручки без подписки. Отдают только статьи
  // с preview: true во frontmatter (см. backend/app/routers/public.py).
  publicCounts: () => request("/public/counts"),
  publicEntries: () => request("/public/entries"),
  publicEntry: (slug) => request(`/public/entries/${slug}`),
  gateCheck: (source) => request("/gate/check", { method: "POST", body: JSON.stringify({ source: source || null }) }),
  gateRecheck: () => request("/gate/recheck", { method: "POST" }),
  home: () => request("/home"),
  entries: (section) => request(`/entries${section ? `?section=${section}` : ""}`),
  entry: (slug) => request(`/entries/${slug}`),
  rateEntry: (slug, value) => request(`/entries/${slug}/rate`, { method: "POST", body: JSON.stringify({ value }) }),
  tools: (category, sort) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    return request(`/tools${qs ? `?${qs}` : ""}`);
  },
  tool: (slug) => request(`/tools/${slug}`),
  prompts: (category) => request(`/prompts${category ? `?category=${category}` : ""}`),
  copyPrompt: (slug) => request(`/prompts/${slug}/copy`, { method: "POST" }),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  calcTokens: (text, model) =>
    request("/calc/tokens", { method: "POST", body: JSON.stringify({ text, model }) }),
  toggleFavorite: (item_type, item_id) =>
    request("/favorites/toggle", { method: "POST", body: JSON.stringify({ item_type, item_id }) }),
  favorites: () => request("/favorites"),
  favoriteIds: () => request("/favorites/ids"),
  components: (q) => request(`/components${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  component: (slug) => request(`/components/${slug}`),
  cheatsheets: () => request("/cheatsheets"),
  cheatsheet: (slug) => request(`/cheatsheets/${slug}`),
  guideLessons: () => request("/guide/lessons"),
  guideLesson: (slug) => request(`/guide/lessons/${slug}`),
  guideComplete: (slug) => request(`/guide/lessons/${slug}/complete`, { method: "POST" }),
  guideProgress: () => request("/guide/progress"),
  sendFeedback: (text) => request("/feedback", { method: "POST", body: JSON.stringify({ text }) }),
  logEvents: (events) => request("/events", { method: "POST", body: JSON.stringify({ events }) }),
  adminStats: () => request("/admin/stats"),
  adminAnalytics: () => request("/admin/analytics"),
  adminUsers: () => request("/admin/users"),
  adminEvents: () => request("/admin/events"),
  adminSearchGaps: () => request("/admin/search-gaps"),
};
