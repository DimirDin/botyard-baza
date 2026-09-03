import { describe, it, expect } from "vitest";
import { compactNumber, plural } from "./format";

describe("compactNumber", () => {
  it("малые числа оставляет как есть", () => {
    expect(compactNumber(0)).toBe("0");
    expect(compactNumber(243)).toBe("243");
    expect(compactNumber(999)).toBe("999");
  });

  it("тысячи — с одним знаком, без лишнего .0", () => {
    expect(compactNumber(1000)).toBe("1k");
    expect(compactNumber(4291)).toBe("4.3k");
    expect(compactNumber(9999)).toBe("10k");
  });

  it("десятки тысяч — без дробной части, чтобы колонка не прыгала", () => {
    expect(compactNumber(13886)).toBe("14k");
    expect(compactNumber(89716)).toBe("90k");
  });

  it("миллионы", () => {
    expect(compactNumber(1_500_000)).toBe("1.5M");
  });

  it("мусор не роняет рендер", () => {
    expect(compactNumber(null)).toBe("—");
    expect(compactNumber(undefined)).toBe("—");
  });
});

describe("plural", () => {
  const К = ["копия", "копии", "копий"];

  it("единственное число", () => {
    expect(plural(1, К)).toBe("копия");
    expect(plural(21, К)).toBe("копия");
    expect(plural(101, К)).toBe("копия");
  });

  it("2–4", () => {
    expect(plural(2, К)).toBe("копии");
    expect(plural(3, К)).toBe("копии");
    expect(plural(142, К)).toBe("копии");
  });

  it("5–20 и всё прочее", () => {
    expect(plural(0, К)).toBe("копий");
    expect(plural(5, К)).toBe("копий");
    expect(plural(98, К)).toBe("копий");
  });

  it("11–14 — исключение, не по последней цифре", () => {
    expect(plural(11, К)).toBe("копий");
    expect(plural(12, К)).toBe("копий");
    expect(plural(14, К)).toBe("копий");
    expect(plural(112, К)).toBe("копий");
  });

  it("мусор не роняет рендер", () => {
    expect(plural(null, К)).toBe("копий");
    expect(plural(undefined, К)).toBe("копий");
  });
});
