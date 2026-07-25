import { describe, it, expect, beforeEach } from "vitest";
import { getAmbientEnabled, setAmbientEnabled } from "./prefs";

// Polyfill localStorage if jsdom's implementation is broken
if (typeof localStorage.clear !== "function") {
  const storage = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
      key: (index) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size;
      },
    },
    writable: true,
    configurable: true,
  });
}

describe("настройка живого фона", () => {
  beforeEach(() => localStorage.clear());

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
});
