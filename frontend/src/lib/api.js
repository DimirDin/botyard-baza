import { getInitData } from "./telegram";
import { mockFetch, USE_MOCK } from "./mock";

const BASE = import.meta.env.VITE_API_BASE || "/api";

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
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
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
  adminStats: () => request("/admin/stats"),
  adminUsers: () => request("/admin/users"),
  adminEvents: () => request("/admin/events"),
};
