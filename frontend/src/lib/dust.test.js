import { describe, it, expect } from "vitest";
import { createDust, stepDust } from "./dust";

describe("createDust", () => {
  it("плотность считается от площади, а не берётся константой", () => {
    const small = createDust({ width: 200, height: 400 });
    const big = createDust({ width: 400, height: 800 });
    expect(big.length).toBeGreaterThan(small.length);
  });

  it("не создаёт частиц для нулевого холста", () => {
    expect(createDust({ width: 0, height: 0 })).toEqual([]);
  });

  it("все частицы лежат внутри холста", () => {
    for (const p of createDust({ width: 300, height: 600 })) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(300);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(600);
    }
  });

  it("частицы всплывают вверх", () => {
    for (const p of createDust({ width: 300, height: 600 })) {
      expect(p.vy).toBeLessThan(0);
    }
  });
});

describe("stepDust", () => {
  it("сдвигает частицу вверх", () => {
    const particles = [{ x: 10, y: 100, r: 1, bokeh: false, vy: -0.5, sway: 0.3, phase: 0, alpha: 0.5, color: [1, 2, 3] }];
    stepDust(particles, 1, 300, 600);
    expect(particles[0].y).toBeCloseTo(99.5);
  });

  it("возвращает улетевшую частицу вниз", () => {
    const particles = [{ x: 10, y: -20, r: 1, bokeh: false, vy: -0.5, sway: 0.3, phase: 0, alpha: 0.5, color: [1, 2, 3] }];
    stepDust(particles, 1, 300, 600);
    expect(particles[0].y).toBeGreaterThan(500);
  });

  it("масштабирует сдвиг по dt", () => {
    const one = [{ x: 0, y: 100, r: 1, bokeh: false, vy: -1, sway: 0, phase: 0, alpha: 1, color: [1, 2, 3] }];
    const two = [{ x: 0, y: 100, r: 1, bokeh: false, vy: -1, sway: 0, phase: 0, alpha: 1, color: [1, 2, 3] }];
    stepDust(one, 1, 300, 600);
    stepDust(two, 2, 300, 600);
    expect(100 - two[0].y).toBeCloseTo((100 - one[0].y) * 2);
  });
});
