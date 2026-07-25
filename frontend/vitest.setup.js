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
