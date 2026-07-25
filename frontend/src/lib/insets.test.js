import { describe, it, expect } from "vitest";
import { readInsets, applyInsets } from "./insets";

describe("readInsets", () => {
  it("возвращает нули, когда Telegram недоступен", () => {
    expect(readInsets(null)).toEqual({ safeTop: 0, safeBottom: 0, contentTop: 0 });
  });

  it("возвращает нули, когда инсетов нет в объекте", () => {
    expect(readInsets({})).toEqual({ safeTop: 0, safeBottom: 0, contentTop: 0 });
  });

  it("читает системные и контентные инсеты", () => {
    const tg = {
      safeAreaInset: { top: 59, bottom: 34, left: 0, right: 0 },
      contentSafeAreaInset: { top: 42, bottom: 0, left: 0, right: 0 },
    };
    expect(readInsets(tg)).toEqual({ safeTop: 59, safeBottom: 34, contentTop: 42 });
  });

  it("не падает, если пришёл только один из двух объектов", () => {
    expect(readInsets({ safeAreaInset: { top: 24, bottom: 12 } })).toEqual({
      safeTop: 24,
      safeBottom: 12,
      contentTop: 0,
    });
  });
});

describe("applyInsets", () => {
  it("пишет три переменные в пикселях", () => {
    const root = document.createElement("div");
    applyInsets(root, { safeTop: 59, safeBottom: 34, contentTop: 42 });
    expect(root.style.getPropertyValue("--safe-top")).toBe("59px");
    expect(root.style.getPropertyValue("--safe-bottom")).toBe("34px");
    expect(root.style.getPropertyValue("--content-safe-top")).toBe("42px");
  });

  it("молча выходит, если корня нет", () => {
    expect(() => applyInsets(null, { safeTop: 1, safeBottom: 2, contentTop: 3 })).not.toThrow();
  });
});
