import { describe, it, expect } from "vitest";
import { extractPlaceholders, fillPlaceholders } from "./placeholders";

describe("extractPlaceholders", () => {
  it("находит плейсхолдеры в порядке появления, без дублей", () => {
    expect(extractPlaceholders("Проверь {код} на {язык}, ещё раз {код}")).toEqual(["код", "язык"]);
  });

  it("возвращает пустой список, когда подставлять нечего", () => {
    expect(extractPlaceholders("Просто текст без переменных")).toEqual([]);
  });

  it("переживает пустое тело", () => {
    expect(extractPlaceholders(undefined)).toEqual([]);
    expect(extractPlaceholders("")).toEqual([]);
  });

  it("не считает плейсхолдером многострочный или слишком длинный блок", () => {
    expect(extractPlaceholders("{очень\nмного}")).toEqual([]);
    expect(extractPlaceholders(`{${"x".repeat(41)}}`)).toEqual([]);
  });
});

describe("fillPlaceholders", () => {
  it("подставляет значения по имени", () => {
    expect(fillPlaceholders("Отревьюь {код}", { "код": "print(1)" })).toBe("Отревьюь print(1)");
  });

  it("подставляет во все вхождения одного имени", () => {
    expect(fillPlaceholders("{a} и {a}", { a: "X" })).toBe("X и X");
  });

  it("оставляет незаполненное как есть — промпт можно дописать руками", () => {
    expect(fillPlaceholders("{код} на {язык}", { "код": "x" })).toBe("x на {язык}");
  });

  it("пробелы не считаются заполнением", () => {
    expect(fillPlaceholders("{код}", { "код": "   " })).toBe("{код}");
  });
});
