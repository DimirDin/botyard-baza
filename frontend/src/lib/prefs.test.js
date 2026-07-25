import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAmbientEnabled, setAmbientEnabled } from "./prefs";

describe("настройка живого фона", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("по умолчанию включена", () => {
    expect(getAmbientEnabled()).toBe(true);
  });

  it("запоминает выключение", () => {
    setAmbientEnabled(false);
    expect(getAmbientEnabled()).toBe(false);
  });

  it("запоминает повторное включение", () => {
    setAmbientEnabled(false);
    setAmbientEnabled(true);
    expect(getAmbientEnabled()).toBe(true);
  });

  it("считает мусор в хранилище включённым состоянием", () => {
    localStorage.setItem("baza:ambient", "непонятно что");
    expect(getAmbientEnabled()).toBe(true);
  });

  it("считает хранилище включённым, если getItem бросает исключение", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("недоступно");
    });
    expect(getAmbientEnabled()).toBe(true);
  });

  it("не падает, если setItem бросает исключение", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("недоступно");
    });
    expect(() => setAmbientEnabled(false)).not.toThrow();
  });
});
