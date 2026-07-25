import { describe, it, expect, beforeEach, vi } from "vitest";

function makeTg({ version = "8.0", overrides = {} } = {}) {
  const handlers = {};
  return {
    handlers,
    ready: vi.fn(),
    expand: vi.fn(),
    disableVerticalSwipes: vi.fn(),
    requestFullscreen: vi.fn(),
    isVersionAtLeast: (v) => parseFloat(version) >= parseFloat(v),
    onEvent: vi.fn((name, fn) => { handlers[name] = fn; }),
    isFullscreen: true,
    safeAreaInset: { top: 59, bottom: 34 },
    contentSafeAreaInset: { top: 42 },
    HapticFeedback: { selectionChanged: vi.fn() },
    ...overrides,
  };
}

async function loadFresh() {
  vi.resetModules();
  return import("./telegram");
}

describe("initTelegram", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-fullscreen");
    document.documentElement.style.cssText = "";
  });

  it("на клиенте 8.0 просит фуллскрин, глушит свайпы и пишет инсеты", async () => {
    const tg = makeTg();
    window.Telegram = { WebApp: tg };
    const { initTelegram } = await loadFresh();

    initTelegram();

    expect(tg.ready).toHaveBeenCalled();
    expect(tg.expand).toHaveBeenCalled();
    expect(tg.disableVerticalSwipes).toHaveBeenCalled();
    expect(tg.requestFullscreen).toHaveBeenCalled();
    expect(document.documentElement.getAttribute("data-fullscreen")).toBe("on");
    expect(document.documentElement.style.getPropertyValue("--safe-top")).toBe("59px");
    expect(document.documentElement.style.getPropertyValue("--content-safe-top")).toBe("42px");
  });

  it("на клиенте 7.0 не трогает методы новее его версии", async () => {
    const tg = makeTg({ version: "7.0" });
    window.Telegram = { WebApp: tg };
    const { initTelegram } = await loadFresh();

    initTelegram();

    expect(tg.expand).toHaveBeenCalled();
    expect(tg.disableVerticalSwipes).not.toHaveBeenCalled();
    expect(tg.requestFullscreen).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute("data-fullscreen")).toBe("off");
  });

  it("на клиенте 7.7 глушит свайпы, но не просит фуллскрин", async () => {
    const tg = makeTg({ version: "7.7" });
    window.Telegram = { WebApp: tg };
    const { initTelegram } = await loadFresh();

    initTelegram();

    expect(tg.disableVerticalSwipes).toHaveBeenCalled();
    expect(tg.requestFullscreen).not.toHaveBeenCalled();
  });

  it("по fullscreenFailed возвращает состояние в off", async () => {
    const tg = makeTg();
    window.Telegram = { WebApp: tg };
    const { initTelegram } = await loadFresh();

    initTelegram();
    tg.isFullscreen = false;
    tg.handlers.fullscreenFailed();

    expect(document.documentElement.getAttribute("data-fullscreen")).toBe("off");
  });

  it("по safeAreaChanged перечитывает инсеты", async () => {
    const tg = makeTg();
    window.Telegram = { WebApp: tg };
    const { initTelegram } = await loadFresh();

    initTelegram();
    tg.safeAreaInset = { top: 24, bottom: 12 };
    tg.handlers.safeAreaChanged();

    expect(document.documentElement.style.getPropertyValue("--safe-top")).toBe("24px");
  });

  it("не падает без Telegram вообще", async () => {
    window.Telegram = undefined;
    const { initTelegram } = await loadFresh();
    expect(() => initTelegram()).not.toThrow();
  });
});

describe("hapticSelection", () => {
  it("вызывает tg.HapticFeedback.selectionChanged() когда Telegram присутствует", async () => {
    const tg = makeTg();
    window.Telegram = { WebApp: tg };
    const { hapticSelection } = await loadFresh();

    hapticSelection();

    expect(tg.HapticFeedback.selectionChanged).toHaveBeenCalled();
  });

  it("не падает без Telegram", async () => {
    window.Telegram = undefined;
    const { hapticSelection } = await loadFresh();
    expect(() => hapticSelection()).not.toThrow();
  });
});
