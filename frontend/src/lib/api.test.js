import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, setAuthErrorHandler } from "./api";

// Регресс, который это закрывает: гейт проверялся один раз на старте, а 401/403
// от обычных ручек в середине сессии не обрабатывался нигде — экраны молча
// переставали грузиться. См. комментарий в api.js.

function mockResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("перехват отказов авторизации", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    setAuthErrorHandler(null);
    vi.unstubAllGlobals();
  });

  it("401 зовёт обработчик и всё равно бросает ошибку", async () => {
    fetch.mockResolvedValue(mockResponse(401, { detail: "initData: expired (>1h)" }));
    const seen = [];
    setAuthErrorHandler((s) => seen.push(s));

    await expect(api.home()).rejects.toThrow();
    expect(seen).toEqual([401]);
  });

  it("403 зовёт обработчик со своим статусом — это отписка, а не протухание", async () => {
    fetch.mockResolvedValue(mockResponse(403, { detail: "Требуется подписка на канал" }));
    const seen = [];
    setAuthErrorHandler((s) => seen.push(s));

    await expect(api.entries()).rejects.toThrow();
    expect(seen).toEqual([403]);
  });

  it("прочие ошибки обработчик не трогают", async () => {
    fetch.mockResolvedValue(mockResponse(500, {}));
    const seen = [];
    setAuthErrorHandler((s) => seen.push(s));

    await expect(api.home()).rejects.toThrow();
    expect(seen).toEqual([]);
  });

  it("успешный ответ обработчик не трогает и возвращает тело", async () => {
    fetch.mockResolvedValue(mockResponse(200, { counts: { entries_count: 197 } }));
    const seen = [];
    setAuthErrorHandler((s) => seen.push(s));

    await expect(api.home()).resolves.toEqual({ counts: { entries_count: 197 } });
    expect(seen).toEqual([]);
  });

  it("204 не пытается разобрать тело", async () => {
    fetch.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error("тела нет"); } });
    await expect(api.guideComplete("x")).resolves.toBeNull();
  });

  it("без установленного обработчика 401 просто бросает ошибку со статусом", async () => {
    fetch.mockResolvedValue(mockResponse(401, {}));
    await expect(api.home()).rejects.toMatchObject({ status: 401 });
  });
});
