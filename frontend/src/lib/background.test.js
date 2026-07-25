import { describe, it, expect } from "vitest";
import { resolveVariant, VIDEO_SCREENS } from "./background";

describe("resolveVariant", () => {
  it("на витринных экранах даёт видео", () => {
    for (const screen of VIDEO_SCREENS) {
      expect(resolveVariant({ screen, enabled: true, reducedMotion: false })).toBe("video");
    }
  });

  it("на остальных экранах даёт пыль", () => {
    expect(resolveVariant({ screen: "base", enabled: true, reducedMotion: false })).toBe("dust");
    expect(resolveVariant({ screen: "entry", enabled: true, reducedMotion: false })).toBe("dust");
  });

  it("при выключенном фоне везде даёт заливку", () => {
    expect(resolveVariant({ screen: "home", enabled: false, reducedMotion: false })).toBe("wash");
    expect(resolveVariant({ screen: "base", enabled: false, reducedMotion: false })).toBe("wash");
  });

  it("reduced-motion перебивает всё остальное", () => {
    expect(resolveVariant({ screen: "home", enabled: true, reducedMotion: true })).toBe("wash");
  });

  it("неизвестный экран считает обычным", () => {
    expect(resolveVariant({ screen: "чего-то-новое", enabled: true, reducedMotion: false })).toBe("dust");
  });
});
