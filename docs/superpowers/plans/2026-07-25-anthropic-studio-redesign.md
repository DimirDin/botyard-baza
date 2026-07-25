# Anthropic Studio Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести фронтенд Mini App «Baza без воды» с терминальной эстетики на тёмную тему Anthropic Studio, включить полноэкранный режим Telegram и добавить живой фон, не трогая механику, гейт и бэкенд.

**Architecture:** Сначала строится полный слой дизайн-токенов и тестовый стенд, затем на них поочерёдно переводятся системные компоненты (хедер, навигация, состояния), потом экраны, и только в конце добавляется фон. Логика, которую можно проверить юнит-тестами (инсеты, выбор варианта фона, частицы, настройки), выносится в чистые модули `src/lib/*` и тестируется через vitest; всё чисто визуальное проверяется сборкой и мок-режимом `npm run dev`.

**Tech Stack:** React 19, Vite 8, oxlint, vitest + jsdom (добавляется в Task 1), `@fontsource-variable/*`, Telegram Mini Apps SDK (Bot API 8.0), Canvas 2D, ffmpeg (разово, для подготовки видео).

## Global Constraints

- **Ни одного изменения** в `backend/`, `bot/`, `db/`, `content/`, `scripts/`. Только `frontend/` и документация.
- **Тема только тёмная.** Светлая версия не реализуется, `themeParams` не подхватывается.
- Палитра ровно эта: `--bg #16130F`, `--surface #201C17`, `--surface-2 #2B251E`, `--line #332C24`, `--text #F5EFE4`, `--text-2 #C4B9A8`, `--text-3 #8B8072`, `--accent #E08256`, `--accent-ink #1A1410`, `--seg-what #8FBF83`, `--seg-why #7FB2CF`, `--seg-example #B394CB`, `--seg-gotcha #D9614A`, `--seg-source #8B8072`, `--error #D9614A`.
- Шкала кегля: `11 / 12 / 13.5 / 15 / 17 / 21 / 25 / 29`. Тело статей — 15 px, `line-height: 1.66`.
- Отступы берутся **только** из переменных Telegram `--tg-safe-area-inset-*` и `--tg-content-safe-area-inset-*`. Констант высоты чёлки в коде быть не должно. `env(safe-area-inset-*)` как источник не используется.
- Веб-шрифты вшиваются в бандл. Никаких ссылок на CDN — CSP это заблокирует.
- Версии Bot API: `disableVerticalSwipes()` — 7.7, `requestFullscreen()` и события safe area — 8.0. Каждый вызов за проверкой `tg.isVersionAtLeast(...)`.
- Иконки не трогаем: 153 PNG в `frontend/public/icons/` остаются как есть.
- **Базовое состояние, от которого отсчитываем регрессии:** `npm run build` проходит за ~0,7 с; `npx oxlint` даёт **7 warning и 0 error** (замерено на `544e786`); итоговый CSS ~7 КБ. После каждой задачи build обязан проходить, а число ошибок линта оставаться нулевым.
- Каждый коммит заканчивается строкой `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Работаем в ветке, не в `main`. В рабочем дереве уже лежат чужие незакоммиченные изменения в `content/` — **не добавлять их в коммиты**, использовать только явный `git add` по путям.

## Структура файлов

**Создаются:**

| Файл | Ответственность |
|---|---|
| `frontend/vitest.config.js` | конфиг тестов, окружение jsdom |
| `frontend/src/lib/insets.js` | чтение инсетов из объекта Telegram и запись их в CSS-переменные |
| `frontend/src/lib/insets.test.js` | тесты на инсеты |
| `frontend/src/lib/background.js` | выбор варианта фона по экрану и настройкам |
| `frontend/src/lib/background.test.js` | тесты на выбор варианта |
| `frontend/src/lib/dust.js` | генерация и шаг частиц canvas-пыли |
| `frontend/src/lib/dust.test.js` | тесты на частицы |
| `frontend/src/lib/prefs.js` | пользовательские настройки в localStorage |
| `frontend/src/lib/prefs.test.js` | тесты на настройки |
| `frontend/src/components/AppHeader.jsx` | шапка экрана вместо `PromptLine` |
| `frontend/src/components/Skeleton.jsx` | скелетоны загрузки |
| `frontend/src/components/AmbientBackground.jsx` | слой фона: заливка, видео, canvas, зерно |
| `frontend/src/styles/background.css` | стили слоя фона |
| `frontend/public/bg/embers.mp4` | ролик-угольки, 439 КБ |
| `frontend/public/bg/embers-poster.jpg` | первый кадр ролика |

**Переписываются:**

| Файл | Что меняется |
|---|---|
| `frontend/src/styles/tokens.css` | полный слой токенов вместо 24 строк цветов |
| `frontend/src/styles/global.css` | тема Studio вместо терминальной |
| `frontend/src/lib/telegram.js` | фуллскрин, инсеты, свайпы, хаптик выбора |
| `frontend/src/components/BottomNav.jsx` | safe-bottom, активное состояние, хаптик |
| `frontend/src/components/States.jsx` | скелетоны вместо braille-спиннера |
| `frontend/src/components/StatsBar.jsx` | без эмодзи, моно с `tabular-nums` |
| `frontend/src/components/SectionNav.jsx` | табы-пилюли, группы-карточки, без `├── └──` |
| `frontend/src/components/ContextBar.jsx` | инлайн-стили → классы |
| `frontend/index.html` | подключение шрифтов |
| `frontend/package.json` | зависимости шрифтов и vitest |
| все 13 экранов + `GuideTrack.jsx` | `PromptLine` → `AppHeader`, инлайн-стили → классы |

**Удаляется:** `frontend/src/components/PromptLine.jsx` (используется в 14 местах — все они переводятся в Task 4).

---

### Task 1: Тестовый стенд и модуль инсетов

Первая задача даёт и инфраструктуру тестов, и первый переиспользуемый модуль. Логика инсетов чистая и тестируемая, поэтому именно с неё начинаем.

**Files:**
- Create: `frontend/vitest.config.js`
- Create: `frontend/src/lib/insets.js`
- Test: `frontend/src/lib/insets.test.js`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: ничего
- Produces:
  - `readInsets(tg)` → `{ safeTop: number, safeBottom: number, contentTop: number }`. Принимает объект `window.Telegram.WebApp` либо `null`/`undefined`. Возвращает нули, если объект пуст или полей нет.
  - `applyInsets(root, insets)` → `void`. Пишет в `root.style` переменные `--safe-top`, `--safe-bottom`, `--content-safe-top` в формате `"NNpx"`.

- [ ] **Step 1: Поставить vitest и jsdom**

```bash
cd frontend
npm install -D vitest@^3 jsdom@^26
```

- [ ] **Step 2: Создать конфиг тестов**

Создать `frontend/vitest.config.js`:

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
```

- [ ] **Step 3: Добавить скрипт теста**

В `frontend/package.json` в секцию `"scripts"` добавить строку после `"lint": "oxlint",`:

```json
    "test": "vitest run",
```

- [ ] **Step 4: Написать падающий тест**

Создать `frontend/src/lib/insets.test.js`:

```js
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
```

- [ ] **Step 5: Запустить тест и убедиться, что он падает**

Run: `cd frontend && npm test`
Expected: FAIL — `Failed to resolve import "./insets"`.

- [ ] **Step 6: Написать модуль**

Создать `frontend/src/lib/insets.js`:

```js
// Отступы берём только у Telegram: env(safe-area-inset-*) внутри вебвью
// работает ненадёжно, поэтому Telegram и завёл собственные значения.
// Никаких констант высоты чёлки — на Android вырез другой.

function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function readInsets(tg) {
  const safe = tg?.safeAreaInset ?? {};
  const content = tg?.contentSafeAreaInset ?? {};
  return {
    safeTop: num(safe.top),
    safeBottom: num(safe.bottom),
    contentTop: num(content.top),
  };
}

export function applyInsets(root, insets) {
  if (!root?.style) return;
  root.style.setProperty("--safe-top", `${insets.safeTop}px`);
  root.style.setProperty("--safe-bottom", `${insets.safeBottom}px`);
  root.style.setProperty("--content-safe-top", `${insets.contentTop}px`);
}
```

- [ ] **Step 7: Запустить тест и убедиться, что он проходит**

Run: `cd frontend && npm test`
Expected: PASS — 6 тестов зелёные.

- [ ] **Step 8: Проверить, что линт и сборка не сломались**

Run: `cd frontend && npx oxlint && npm run build`
Expected: линт — по-прежнему 0 error; build — `✓ built in ...`.

- [ ] **Step 9: Коммит**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.js frontend/src/lib/insets.js frontend/src/lib/insets.test.js
git commit -m "$(cat <<'EOF'
test: vitest + модуль безопасных отступов Telegram

Первый тестируемый модуль фронтенда. readInsets/applyInsets читают
safeAreaInset и contentSafeAreaInset и пишут их в CSS-переменные.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Дизайн-токены и шрифты

Фундамент. Приложение после этой задачи уже становится тёплым и тёмным, но раскладка не меняется — старые имена токенов остаются алиасами, чтобы 510 строк `global.css` и инлайн-стили продолжали работать.

**Files:**
- Modify: `frontend/src/styles/tokens.css` (полная замена, было 24 строки)
- Modify: `frontend/index.html:3-9`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: ничего
- Produces: CSS-переменные, которыми пользуются все последующие задачи — `--bg`, `--surface`, `--surface-2`, `--line`, `--text`, `--text-2`, `--text-3`, `--accent`, `--accent-ink`, `--seg-*`, `--error`, `--font-display`, `--font-sans`, `--font-mono`, `--fs-1`…`--fs-8`, `--sp-1`…`--sp-7`, `--r-sm`, `--r`, `--r-lg`, `--r-full`, `--shadow-1`, `--shadow-2`, `--dur-fast`, `--dur`, `--dur-slow`, `--ease`, `--ease-spring`, `--safe-top`, `--safe-bottom`, `--content-safe-top`.

- [ ] **Step 1: Поставить шрифты**

```bash
cd frontend
npm install @fontsource-variable/literata@^5 @fontsource-variable/jetbrains-mono@^5
```

- [ ] **Step 2: Проверить кириллицу и точку входа CSS**

Run: `ls frontend/node_modules/@fontsource-variable/literata/index.css && ls frontend/node_modules/@fontsource-variable/literata/files/ | grep -i cyrillic | head`
Expected: путь `index.css` существует; ниже — непустой список вида `literata-cyrillic-*-normal.woff2`.

Если `index.css` нет, посмотреть реальную точку входа: `ls frontend/node_modules/@fontsource-variable/literata/*.css` — и использовать её в импорте на следующем шаге.

Если список пуст — Literata не подходит. Тогда:

```bash
npm uninstall @fontsource-variable/literata
npm install @fontsource-variable/source-serif-4@^5
```

и дальше во всех шагах вместо `@fontsource-variable/literata` использовать `@fontsource-variable/source-serif-4`, а вместо `"Literata Variable"` — `"Source Serif 4 Variable"`. Запасной вариант второго уровня — `@fontsource/pt-serif`.

- [ ] **Step 3: Заменить tokens.css целиком**

Записать `frontend/src/styles/tokens.css`:

```css
/* Дизайн-система «Anthropic Studio» — спека
   docs/superpowers/specs/2026-07-25-anthropic-studio-redesign-design.md
   Тема только тёмная: светлой версии в продукте нет. */

@import "@fontsource-variable/literata/index.css";
@import "@fontsource-variable/jetbrains-mono/index.css";

:root {
  /* ---- цвет ---- */
  --bg: #16130F;
  --surface: #201C17;
  --surface-2: #2B251E;
  --line: #332C24;
  --text: #F5EFE4;
  --text-2: #C4B9A8;
  --text-3: #8B8072;
  --accent: #E08256;
  --accent-ink: #1A1410;

  --seg-what: #8FBF83;
  --seg-why: #7FB2CF;
  --seg-example: #B394CB;
  --seg-gotcha: #D9614A;
  --seg-source: #8B8072;
  --error: #D9614A;

  /* ---- типографика ---- */
  --font-display: "Literata Variable", Georgia, "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;

  --fs-1: 11px;
  --fs-2: 12px;
  --fs-3: 13.5px;
  --fs-4: 15px;
  --fs-5: 17px;
  --fs-6: 21px;
  --fs-7: 25px;
  --fs-8: 29px;

  /* ---- размеры ---- */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-7: 32px;

  --r-sm: 10px;
  --r: 14px;
  --r-lg: 20px;
  --r-full: 999px;

  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-2: 0 10px 26px -16px rgba(0, 0, 0, 0.9);

  /* ---- движение ---- */
  --dur-fast: 120ms;
  --dur: 200ms;
  --dur-slow: 450ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ---- безопасные зоны ----
     Значения приходят из Telegram через lib/insets.js. Фоллбэк — нули:
     в обычном (не полноэкранном) режиме вебвью уже отрисован под хромом
     Telegram, и дополнительные отступы там не нужны. */
  --safe-top: 0px;
  --safe-bottom: 0px;
  --content-safe-top: 0px;

  /* ---- алиасы старых имён ----
     Нужны, чтобы global.css и инлайн-стили экранов продолжали работать,
     пока их переводят на новые токены. Удаляются в Task 12. */
  --text-heading: var(--text);
  --text-body: var(--text-2);
  --text-muted: var(--text-3);
  --text-muted-dim: var(--text-3);
}
```

- [ ] **Step 4: Убрать из global.css собственный импорт токенов**

`frontend/src/styles/global.css` строка 1 сейчас — `@import "./tokens.css";`. Оставить как есть: импорт шрифтов внутри `tokens.css` подтянется следом. Никаких правок в этом шаге не требуется — шаг существует, чтобы явно это зафиксировать и не «чинить» рабочее.

- [ ] **Step 5: Задать цвет фона документа до загрузки JS**

В `frontend/index.html` заменить строку 10 (`  <body>`) на:

```html
  <body style="background:#16130F">
```

Это убирает белую вспышку между открытием вебвью и первым рендером React.

- [ ] **Step 6: Собрать и посмотреть**

```bash
cd frontend && npm run build && npm run dev
```

Expected: build проходит; на `http://localhost:5173` приложение открывается в мок-режиме, фон тёплый тёмный `#16130F`, заголовки и текст читаются, шрифт моноширинного текста — JetBrains Mono (буквы `l`, `1`, `0` заметно отличаются от системного моно).

- [ ] **Step 7: Проверить линт**

Run: `cd frontend && npx oxlint`
Expected: 0 error.

- [ ] **Step 8: Коммит**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/styles/tokens.css frontend/index.html
git commit -m "$(cat <<'EOF'
feat(ui): слой дизайн-токенов Anthropic Studio и шрифты в бандле

Полная палитра, шкала кегля, отступы, радиусы, тени и тайминги вместо
24 строк цветов. Literata и JetBrains Mono вшиты в бандл — раньше
--font-mono был объявлен, но не подключён. Старые имена оставлены
алиасами до конца перевода экранов.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Полноэкранный режим и инсеты

**Files:**
- Modify: `frontend/src/lib/telegram.js` (сейчас 54 строки)
- Test: `frontend/src/lib/telegram.test.js` (создать)

**Interfaces:**
- Consumes: `readInsets`, `applyInsets` из `src/lib/insets.js` (Task 1)
- Produces:
  - `initTelegram()` → `void`. Расширяется: включает фуллскрин, глушит вертикальные свайпы, подписывается на события и синхронизирует инсеты.
  - `hapticSelection()` → `void`. Новый экспорт, вызывает `HapticFeedback.selectionChanged()`.
  - Побочный эффект: на `document.documentElement` появляется атрибут `data-fullscreen` со значением `"on"` или `"off"`, и три CSS-переменные инсетов.

- [ ] **Step 1: Написать падающий тест**

Создать `frontend/src/lib/telegram.test.js`:

```js
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
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd frontend && npm test`
Expected: FAIL — `disableVerticalSwipes` не вызван, атрибут `data-fullscreen` не выставлен.

- [ ] **Step 3: Переписать telegram.js**

Заменить содержимое `frontend/src/lib/telegram.js`. Первые строки (объявление `tg` и `initTelegram`) заменить на приведённый ниже блок; функции `getInitData`, `getStartParam`, `hapticSuccess`, `hapticError`, `openLink`, `shareLink`, `onBackButton`, `hideBackButton` оставить без изменений после него.

```js
import { readInsets, applyInsets } from "./insets";

const tg = window.Telegram?.WebApp;

function syncInsets() {
  applyInsets(document.documentElement, readInsets(tg));
}

function syncFullscreen() {
  document.documentElement.setAttribute(
    "data-fullscreen",
    tg?.isFullscreen ? "on" : "off"
  );
  // Кнопки Telegram переезжают вместе с режимом, поэтому инсеты
  // перечитываем здесь же, не дожидаясь отдельного события.
  syncInsets();
}

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();

  // 7.7: без этого свайп вниз по статье закрывает приложение.
  // В полноэкранном режиме это критично — экран большой, свайпают часто.
  if (tg.isVersionAtLeast("7.7")) tg.disableVerticalSwipes();

  if (tg.isVersionAtLeast("8.0")) {
    tg.onEvent("fullscreenChanged", syncFullscreen);
    tg.onEvent("fullscreenFailed", syncFullscreen);
    tg.onEvent("safeAreaChanged", syncInsets);
    tg.onEvent("contentSafeAreaChanged", syncInsets);
    tg.requestFullscreen();
    syncFullscreen();
  } else {
    // Фуллскрина как понятия до 8.0 нет — не читаем tg.isFullscreen,
    // чтобы не полагаться на его (неопределённое на старых клиентах) значение.
    document.documentElement.setAttribute("data-fullscreen", "off");
  }
}

export function hapticSelection() {
  tg?.HapticFeedback?.selectionChanged();
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

Run: `cd frontend && npm test`
Expected: PASS — 12 тестов зелёные (6 из Task 1 + 6 новых).

- [ ] **Step 5: Дать вёрстке знать про режим**

В `frontend/src/styles/global.css` после строки `@import "./tokens.css";` добавить:

```css
/* В полноэкранном режиме приложение заезжает под вырез экрана и под
   плавающие «✕» и «⋮» Telegram. Скрим и отступы включаются только здесь. */
:root[data-fullscreen="on"] {
  --header-pad-top: calc(var(--sp-4) + var(--safe-top) + var(--content-safe-top));
}
:root[data-fullscreen="off"] {
  --header-pad-top: var(--sp-4);
}
```

- [ ] **Step 6: Проверить сборку и линт**

Run: `cd frontend && npx oxlint && npm run build`
Expected: 0 error; build проходит.

- [ ] **Step 7: Коммит**

```bash
git add frontend/src/lib/telegram.js frontend/src/lib/telegram.test.js frontend/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(tma): полноэкранный режим Bot API 8.0 и безопасные отступы

requestFullscreen с фоллбэком по isVersionAtLeast, disableVerticalSwipes
(7.7), подписка на fullscreenChanged/Failed и safeAreaChanged. Состояние
режима — в data-fullscreen на <html>, инсеты — в CSS-переменных.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: AppHeader вместо PromptLine

Самая механическая задача плана: `PromptLine` используется в 14 местах. Делается одним заходом, потому что половинчатое состояние (часть экранов со старой шапкой, часть с новой) выглядит сломанным.

**Files:**
- Create: `frontend/src/components/AppHeader.jsx`
- Delete: `frontend/src/components/PromptLine.jsx`
- Modify: `frontend/src/screens/HomeScreen.jsx:2,24-44`, `EntriesListScreen.jsx:4,61,74,96`, `EntryScreen.jsx:2,28`, `ToolsListScreen.jsx:2,126`, `ToolDetail.jsx:2,29`, `ComponentDetail.jsx:2,43`, `PromptsListScreen.jsx:2,73`, `CalculatorScreen.jsx:2,55`, `FavoritesScreen.jsx:2,29`, `SearchScreen.jsx:2,46`, `CheatsheetsScreen.jsx:4,29,42`, `GateScreen.jsx:2,33`, `AdminScreen.jsx:2,55`
- Modify: `frontend/src/components/GuideTrack.jsx:2,109,192,215`
- Modify: `frontend/src/styles/global.css` (заменить блок `.promptline*`, строки 37-64)

**Interfaces:**
- Consumes: `--header-pad-top` (Task 3), токены (Task 2)
- Produces: компонент `AppHeader` с пропсами `{ title: string, subtitle?: string, action?: ReactNode }`. `action` рендерится **слева** от заголовка — правый верхний угол в полноэкранном режиме занимают кнопки Telegram.

- [ ] **Step 1: Создать AppHeader**

Создать `frontend/src/components/AppHeader.jsx`:

```jsx
// Шапка экрана. Кнопка действия стоит слева осознанно: в полноэкранном
// режиме правый верхний угол занимают плавающие «✕» и «⋮» Telegram.
export function AppHeader({ title, subtitle = null, action = null }) {
  return (
    <header className="app-header">
      {action && <div className="app-header__action">{action}</div>}
      <div className="app-header__text">
        <h1 className="app-header__title">{title}</h1>
        {subtitle && <span className="app-header__subtitle">{subtitle}</span>}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Заменить стили шапки**

В `frontend/src/styles/global.css` удалить весь блок `/* ---- терминальный хром ---- */` вместе с правилами `.promptline`, `.promptline__arrow`, `.promptline__segment`, `.promptline__dirty` (строки 35-64) и вставить на их место:

```css
/* ---- шапка экрана ---- */

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-4) var(--sp-3);
  padding-top: var(--header-pad-top, var(--sp-4));
  transition: padding-top var(--dur-slow) var(--ease);
}

/* Скрим нужен только в полноэкранном режиме: там кнопки Telegram белые
   и рисуются поверх фона, а на светлых кадрах ролика они пропадают. */
:root[data-fullscreen="on"] .app-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--bg) 45%, transparent);
  z-index: -1;
  pointer-events: none;
}

.app-header__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.app-header__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-8);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: var(--text);
}

.app-header__subtitle {
  font-family: var(--font-mono);
  font-size: var(--fs-1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
}

.app-header__action {
  flex: none;
  order: -1;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--r-full);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text-2);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease);
}

.icon-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.icon-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Перевести экраны**

Во всех 14 местах заменить импорт и вызов. Соответствие старых вызовов новым:

| Было | Стало |
|---|---|
| `<PromptLine section="home" right={admin} />` | `<AppHeader title="База" subtitle="без воды · @claudedry" action={admin} />` |
| `<PromptLine section="base" ... />` | `<AppHeader title="База" subtitle={group ?? "статьи"} action={backOrSearch} />` |
| `<PromptLine section="base/cheat" ... />` | `<AppHeader title="Шпаргалки" action={backOrSearch} />` |
| `<PromptLine section="entry" ... />` | `<AppHeader title="Статья" subtitle={slug} />` |
| `<PromptLine section="tools" ... />` | `<AppHeader title="Софт" subtitle={group ?? "инструменты"} action={backOrSearch} />` |
| `<PromptLine section="tool" ... />` | `<AppHeader title="Инструмент" subtitle={slug} />` |
| `<PromptLine section="component" ... />` | `<AppHeader title="Компонент" subtitle={slug} />` |
| `<PromptLine section="prompts" ... />` | `<AppHeader title="Промпты" subtitle={group ?? "библиотека"} action={backOrSearch} />` |
| `<PromptLine section="calc" />` | `<AppHeader title="Калькулятор" subtitle="токены" />` |
| `<PromptLine section="favorites" right={search} />` | `<AppHeader title="Моё" subtitle="избранное" action={search} />` |
| `<PromptLine section="search" />` | `<AppHeader title="Поиск" />` |
| `<PromptLine section="cheat" ... />` | `<AppHeader title="Шпаргалки" action={close} />` |
| `<PromptLine section="gate" dirty />` | `<AppHeader title="Baza" subtitle="без воды" />` |
| `<PromptLine section="admin" ... />` | `<AppHeader title="Админка" subtitle="аналитика" action={back} />` |
| `<PromptLine section="guide" ... />` (3 места в GuideTrack) | `<AppHeader title="Гид" subtitle={level ? \`уровень ${level}\` : "путь"} action={backOrSearch} />` |

Кнопки в `action` переводятся на класс `icon-btn` вместо инлайновых `style={{ cursor: "pointer" }}`. Эмодзи в них (`🔍 поиск`, `✗ назад`, `✗ закрыть`) заменяются на текст без эмодзи: `поиск`, `назад`, `закрыть`.

- [ ] **Step 4: Удалить PromptLine**

```bash
rm frontend/src/components/PromptLine.jsx
```

- [ ] **Step 5: Убедиться, что ссылок не осталось**

Run: `cd frontend && grep -rn "PromptLine" src/ || echo "ссылок нет"`
Expected: `ссылок нет`.

- [ ] **Step 6: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 12 тестов зелёные; build проходит.

- [ ] **Step 7: Посмотреть глазами**

Run: `cd frontend && npm run dev`
Expected: на каждом из экранов (Главная, База, Софт, Промпты, Гид, Моё, Поиск) вместо строки `➜ baza git:(...)` стоит крупный заголовок антиквой с моно-подписью капсом; кнопка действия — слева от заголовка.

- [ ] **Step 8: Коммит**

```bash
git add frontend/src/components/AppHeader.jsx frontend/src/components/GuideTrack.jsx frontend/src/screens/ frontend/src/styles/global.css
git add -u frontend/src/components/PromptLine.jsx
git commit -m "$(cat <<'EOF'
feat(ui): AppHeader вместо терминальной промпт-строки

PromptLine удалён, все 14 мест переведены на AppHeader. Кнопка действия
переехала влево — в полноэкранном режиме правый верхний угол занимают
кнопки Telegram. Скрим сверху включается только в фуллскрине.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Нижняя навигация

**Files:**
- Modify: `frontend/src/components/BottomNav.jsx` (31 строка)
- Modify: `frontend/src/styles/global.css` (блок `.bottom-nav*`, строки 264-310 до правок Task 4; после Task 4 искать по селектору)

**Interfaces:**
- Consumes: `hapticSelection` из `src/lib/telegram.js` (Task 3), `--safe-bottom` (Task 3)
- Produces: ничего для следующих задач

- [ ] **Step 1: Добавить хаптик в компонент**

Заменить `frontend/src/components/BottomNav.jsx` целиком:

```jsx
import { hapticSelection } from "../lib/telegram";

// Версия в query — против кэша WebView Telegram: он держит PNG по пути
// на диске независимо от «Очистить кэш» в приложении.
const ICON_VERSION = Date.now();

const ITEMS = [
  { id: "base", icon: "/icons/footer/base.png", label: "База" },
  { id: "tools", icon: "/icons/footer/tools.png", label: "Софт" },
  { id: "prompts", icon: "/icons/footer/prompts.png", label: "Промпты" },
  { id: "guide", icon: "/icons/footer/guide.png", label: "Гид" },
  { id: "favorites", icon: "/icons/footer/favorites.png", label: "Моё" },
];

export function BottomNav({ active, onSelect }) {
  const select = (id) => {
    hapticSelection();
    onSelect(id);
  };

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav__item ${active === item.id ? "bottom-nav__item--active" : ""}`}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => select(item.id)}
        >
          <img className="bottom-nav__png" src={`${item.icon}?v=${ICON_VERSION}`} alt="" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Переписать стили навигации**

В `frontend/src/styles/global.css` заменить блок `/* ---- bottom nav ---- */` целиком на:

```css
/* ---- нижняя навигация ---- */

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--line);
  /* Без этого «Моё» перехватывается системным жестом home. */
  padding-bottom: var(--safe-bottom);
  z-index: 20;
  transition: padding-bottom var(--dur-slow) var(--ease);
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: var(--sp-3) 0 var(--sp-2);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-3);
  font-family: var(--font-sans);
  font-size: var(--fs-1);
  transition: color var(--dur) var(--ease);
}

.bottom-nav__item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -3px;
}

.bottom-nav__item--active {
  color: var(--accent);
  font-weight: 600;
}

/* Неактивные иконки приглушаем яркостью, а не grayscale(1) —
   обесцвеченная иконка читается как «выключено», а не «неактивно». */
.bottom-nav__png {
  width: 22px;
  height: 22px;
  opacity: 0.55;
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease-spring);
}

.bottom-nav__item--active .bottom-nav__png {
  opacity: 1;
  transform: translateY(-1px) scale(1.06);
}
```

- [ ] **Step 3: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 12 тестов зелёные; build проходит.

- [ ] **Step 4: Посмотреть глазами**

Run: `cd frontend && npm run dev`
Expected: активный таб терракотовый и слегка приподнят, неактивные — приглушённые, но цветные. Иконки не серые.

- [ ] **Step 5: Коммит**

```bash
git add frontend/src/components/BottomNav.jsx frontend/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(ui): нижняя навигация под безопасную зону, с хаптиком

padding-bottom по --safe-bottom, иначе «Моё» перехватывается системным
жестом. Неактивные иконки приглушены прозрачностью вместо grayscale(1).
hapticSelection при переключении — функция была в lib, но не вызывалась.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Скелетоны вместо спиннера

**Files:**
- Create: `frontend/src/components/Skeleton.jsx`
- Modify: `frontend/src/components/States.jsx` (16 строк)
- Modify: `frontend/src/styles/global.css` (блок `.state-empty, .state-error` и `.spinner`)

**Interfaces:**
- Consumes: токены (Task 2)
- Produces:
  - `<Skeleton lines={number} />` — набор полос-плейсхолдеров, по умолчанию `lines = 3`
  - `<SkeletonList count={number} />` — набор карточек-плейсхолдеров, по умолчанию `count = 3`
  - `Spinner` из `States.jsx` сохраняет имя и сигнатуру, но рендерит `<SkeletonList />` — чтобы не переписывать 13 экранов, которые его импортируют

- [ ] **Step 1: Создать компонент**

Создать `frontend/src/components/Skeleton.jsx`:

```jsx
export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="skeleton__line"
          style={{ width: i === lines - 1 ? "46%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Загрузка">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <span className="skeleton__line skeleton__line--title" />
          <span className="skeleton__line" />
          <span className="skeleton__line" style={{ width: "46%" }} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Переписать States.jsx**

Заменить `frontend/src/components/States.jsx` целиком:

```jsx
import { SkeletonList } from "./Skeleton";

// Имя Spinner сохранено: его импортируют 13 экранов. Изменилось только то,
// что он рисует — скелетоны вместо braille-спиннера, чтобы контент
// не прыгал в момент подстановки данных.
export function Spinner() {
  return <SkeletonList count={3} />;
}

export function EmptyState({ text = "Пока пусто" }) {
  return <div className="state-empty">{text}</div>;
}

export function ErrorState({ onRetry }) {
  return (
    <div className="state-error">
      <p className="state-error__text">Не удалось загрузить</p>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Добавить стили**

В `frontend/src/styles/global.css` заменить блок `/* ---- states ---- */` целиком на:

```css
/* ---- состояния загрузки и ошибок ---- */

.skeleton,
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.skeleton-list {
  gap: var(--sp-3);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--line);
}

.skeleton__line {
  display: block;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%);
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.5s linear infinite;
}

.skeleton__line--title {
  height: 16px;
  width: 72%;
}

@keyframes skeleton-shimmer {
  to {
    background-position: -220% 0;
  }
}

.state-empty,
.state-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-7) var(--sp-4);
  text-align: center;
  color: var(--text-3);
  font-size: var(--fs-4);
}

.state-error__text {
  margin: 0;
  color: var(--error);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton__line {
    animation: none;
  }
}
```

- [ ] **Step 4: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 12 тестов зелёные; build проходит.

- [ ] **Step 5: Посмотреть глазами**

Run: `cd frontend && npm run dev`, затем в DevTools включить троттлинг сети «Slow 3G» и перезагрузить.
Expected: вместо `⠋⠙⠸ $ fetching...` по центру видны три карточки-плейсхолдера с бегущим бликом; при подстановке данных контент не прыгает.

- [ ] **Step 6: Коммит**

```bash
git add frontend/src/components/Skeleton.jsx frontend/src/components/States.jsx frontend/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(ui): скелетоны загрузки вместо braille-спиннера

Spinner сохранил имя и сигнатуру — его импортируют 13 экранов — но рисует
карточки-плейсхолдеры. Контент больше не прыгает при подстановке данных.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Тема Studio в global.css

Ядро визуального перехода: карточки, кнопки, чипы, табы, группы, лейблы сегментов, тело статьи.

**Files:**
- Modify: `frontend/src/styles/global.css` (блоки `.chip`, `.fav-btn`, `.segment-label*`, `.gotcha-block`, `.card*`, `.guide-progress*`, `.toast*`, `.section-tabs`, `.section-tab*`, `.group-row*`, `.article-body*`, `.raw-source*`, `.cheatsheet-body*`)

**Interfaces:**
- Consumes: токены (Task 2)
- Produces: классы, которыми пользуется Task 8 при чистке инлайн-стилей — `.card`, `.card__cover`, `.card__cover--green`, `.card__cover--violet`, `.card__pad`, `.card__title`, `.card__desc`, `.card__meta`, `.card__row`, `.btn`, `.btn--primary`, `.btn--ghost`, `.chip`, `.stack`, `.sect`, `.eyebrow`, `.eyebrow--what|why|example|gotcha`, `.sheet`, `.badge`

- [ ] **Step 1: Переписать карточки и добавить обложки**

Заменить блок `/* ---- cards ---- */` на:

```css
/* ---- карточки ---- */

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.sect {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-6);
}

.card {
  display: flex;
  flex-direction: column;
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-1), var(--shadow-2);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease);
}

.card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
}

/* Обложка кодирует раздел цветом — она не декоративная. */
.card__cover {
  height: 78px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #D89A6E, #BE5B36 55%, #7A4B58);
}

.card__cover::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 76% 26%, rgba(255, 255, 255, 0.4), transparent 46%),
    repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.08) 0 2px, transparent 2px 13px);
}

.card__cover--green { background: linear-gradient(135deg, #A9BC9E, #5C7C55 60%, #35513E); }
.card__cover--violet { background: linear-gradient(135deg, #B3A0C4, #7B5E92 58%, #46375B); }

.card__pad {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-3) var(--sp-4);
}

.card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-5);
  font-weight: 400;
  line-height: 1.25;
  color: var(--text);
  text-wrap: balance;
}

.card__desc {
  margin: 0;
  font-size: var(--fs-3);
  line-height: 1.5;
  color: var(--text-2);
}

.card__meta {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: var(--fs-1);
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
}

.card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
}

.badge {
  flex: none;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--r-full);
  background: var(--accent);
  color: var(--accent-ink);
}

/* Лист статьи: длинный текст на плотной подложке поверх живого фона. */
.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  padding: var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-1), var(--shadow-2);
}
```

- [ ] **Step 2: Переписать кнопки и чипы**

Заменить блоки `.chip`, `.chip--active`, `.chip--editors`, `.fav-btn*` на:

```css
/* ---- кнопки ---- */

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-sans);
  font-size: var(--fs-3);
  padding: var(--sp-3) var(--sp-5);
  border-radius: var(--r-full);
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease), filter var(--dur) var(--ease),
    border-color var(--dur) var(--ease), color var(--dur) var(--ease);
}

.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.btn--primary {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}
.btn--primary:hover { filter: brightness(1.07); }

.btn--ghost {
  background: var(--surface);
  border-color: var(--line);
  color: var(--text-2);
  box-shadow: var(--shadow-1);
}
.btn--ghost:hover { border-color: var(--accent); color: var(--text); }

.chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--fs-2);
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--r-full);
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--dur) var(--ease), color var(--dur) var(--ease);
}

.chip:hover { border-color: var(--accent); color: var(--text); }

.chip--active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.chip--editors {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--fs-2);
  line-height: 1.2;
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--r-full);
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--dur) var(--ease), color var(--dur) var(--ease);
}

.fav-btn--active {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.fav-btn__star { font-size: var(--fs-3); line-height: 1; }
```

- [ ] **Step 3: Переписать лейблы сегментов**

Заменить блоки `.segment-label*` и `.gotcha-block` на:

```css
/* ---- лейблы разделов статьи ----
   Пять цветов — смысловая система (что это / зачем тебе / пример /
   грабли / источник), а не украшение. Меняются значения, не роли. */

.eyebrow,
.segment-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  border-bottom: 1px solid var(--line);
  padding-bottom: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.eyebrow--what, .segment-label--what { color: var(--seg-what); }
.eyebrow--why, .segment-label--why { color: var(--seg-why); }
.eyebrow--example, .segment-label--example { color: var(--seg-example); }
.eyebrow--gotcha, .segment-label--gotcha { color: var(--seg-gotcha); }
.eyebrow--source, .segment-label--source { color: var(--seg-source); }

.gotcha-block {
  border-left: 3px solid var(--seg-gotcha);
  background: color-mix(in srgb, var(--seg-gotcha) 9%, transparent);
  border-radius: 0 var(--r) var(--r) 0;
  padding: var(--sp-3);
}
```

- [ ] **Step 4: Переписать табы, группы, прогресс, тост и тело статьи**

Заменить блоки `.section-tabs`, `.section-tab*`, `.group-row*`, `.guide-progress*`, `.toast*`, `.article-body*`, `.raw-source*`, `.cheatsheet-body*` на:

```css
/* ---- табы разделов и группы ---- */

.section-tabs {
  display: flex;
  gap: var(--sp-1);
  padding: var(--sp-1);
  margin-bottom: var(--sp-3);
  border-radius: var(--r-full);
  background: var(--surface-2);
  overflow-x: auto;
  scrollbar-width: none;
}

.section-tabs::-webkit-scrollbar { display: none; }

.section-tab {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--sp-2) var(--sp-1);
  border: none;
  border-radius: var(--r-full);
  background: transparent;
  color: var(--text-3);
  font-family: var(--font-mono);
  font-size: var(--fs-1);
  cursor: pointer;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}

.section-tab span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-tab img { width: 20px; height: 20px; opacity: 0.55; }

.section-tab--active {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.section-tab--active img { opacity: 1; }

.section-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

.group-row {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  margin-bottom: var(--sp-2);
  border-radius: var(--r);
  background: var(--surface);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease);
}

.group-row:hover { transform: translateX(2px); border-color: var(--accent); }

.group-row__icon { width: 30px; height: 30px; flex: none; }

.group-row__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-row__label { font-size: var(--fs-4); color: var(--text); font-weight: 500; }

.group-row__desc {
  font-size: var(--fs-2);
  line-height: 1.45;
  color: var(--text-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-row__count {
  flex: none;
  padding-top: 3px;
  font-family: var(--font-mono);
  font-size: var(--fs-2);
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
}

/* ---- прогресс гида ---- */

.guide-progress { display: flex; align-items: center; gap: var(--sp-2); margin-top: var(--sp-2); }

.guide-progress__bar {
  flex: 1;
  height: 5px;
  border-radius: var(--r-full);
  background: var(--surface-2);
  overflow: hidden;
}

.guide-progress__fill {
  height: 100%;
  border-radius: var(--r-full);
  background: var(--accent);
  transition: width var(--dur) var(--ease);
}

.guide-progress__label {
  font-family: var(--font-mono);
  font-size: var(--fs-1);
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
  white-space: nowrap;
}

/* ---- тост ---- */

.toast {
  position: fixed;
  bottom: calc(76px + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-full);
  background: var(--surface);
  border: 1px solid var(--seg-what);
  color: var(--seg-what);
  font-family: var(--font-sans);
  font-size: var(--fs-3);
  box-shadow: var(--shadow-2);
}

.toast--error { border-color: var(--error); color: var(--error); }

/* ---- тело статьи ---- */

.article-body {
  font-family: var(--font-sans);
  font-size: var(--fs-4);
  line-height: 1.66;
  color: var(--text-2);
}

.article-body h1,
.article-body h2,
.article-body h3 {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--text);
  text-wrap: balance;
}

.article-body h2 { font-size: var(--fs-7); }
.article-body h3 { font-size: var(--fs-6); }

.article-body img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--r);
  border: 1px solid var(--line);
  margin: var(--sp-1) 0 var(--sp-4);
}

.article-body pre,
.article-body code,
.raw-source__pre {
  font-family: var(--font-mono);
  font-size: var(--fs-3);
  background: var(--surface-2);
  border-radius: var(--r-sm);
}

.article-body pre { padding: var(--sp-3); overflow-x: auto; }
.article-body code { padding: 1px 5px; }

.raw-source { margin-top: var(--sp-2); }

.raw-source__summary {
  font-family: var(--font-mono);
  font-size: var(--fs-3);
  color: var(--accent);
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.raw-source__summary::-webkit-details-marker { display: none; }
.raw-source__summary::before { content: "▸ "; }
.raw-source[open] .raw-source__summary::before { content: "▾ "; }

.raw-source__pre {
  font-size: var(--fs-2);
  line-height: 1.5;
  color: var(--text-2);
  border: 1px solid var(--line);
  padding: var(--sp-3);
  margin-top: var(--sp-2);
  max-height: 480px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ---- шпаргалки ---- */

.cheatsheet-body table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-3);
  margin: var(--sp-3) 0;
}

.cheatsheet-body th {
  font-family: var(--font-mono);
  font-size: var(--fs-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-3);
  text-align: left;
  padding: var(--sp-2);
  border-bottom: 1px solid var(--line);
}

.cheatsheet-body td {
  padding: var(--sp-2);
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}

.cheatsheet-body td:first-child {
  font-family: var(--font-mono);
  color: var(--seg-what);
  white-space: nowrap;
}
```

- [ ] **Step 5: Обновить базовые правила документа**

Заменить блок `body { ... }` и `.page { ... }` на:

```css
body {
  margin: 0;
  background: var(--bg);
  color: var(--text-2);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

a { color: var(--seg-why); }

button { font-family: inherit; }

.page {
  flex: 1;
  padding: 0 var(--sp-4);
  padding-bottom: calc(96px + var(--safe-bottom));
  overflow-y: auto;
}
```

- [ ] **Step 6: Убрать осиротевший класс дерева**

Удалить блок `.tree-item { ... }` — символы `├── └──` больше не используются (они убираются из `SectionNav.jsx` в Task 8).

- [ ] **Step 7: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 12 тестов зелёные; build проходит.

- [ ] **Step 8: Посмотреть глазами**

Run: `cd frontend && npm run dev`
Expected: карточки — с тёплыми тенями и скруглением 20px; кнопки — пилюли; табы разделов — пилюльный переключатель с терракотовым активным; лейблы сегментов статьи — моно-капс с цветной подписью и линией снизу.

- [ ] **Step 9: Коммит**

```bash
git add frontend/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(ui): тема Anthropic Studio — карточки, кнопки, табы, тело статьи

Карточки с обложками-градиентами, пилюльные кнопки и чипы, табы-сегменты,
лист .sheet под длинный текст. Пять цветов сегментов статьи сохранены как
смысловая система, изменены только значения под тёмную бумагу.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Чистка экранов от инлайн-стилей

В коде 204 вхождения `style={{`. Задача делается в три коммита по группам экранов, чтобы регрессию было видно сразу и было к чему откатываться.

**Files:**
- Modify: `frontend/src/screens/HomeScreen.jsx` (17 инлайнов), `EntriesListScreen.jsx` (8), `EntryScreen.jsx` (9), `GateScreen.jsx` (7)
- Modify: `frontend/src/screens/ToolsListScreen.jsx` (17), `ToolDetail.jsx` (11), `ComponentDetail.jsx` (5), `PromptsListScreen.jsx` (7), `components/GuideTrack.jsx` (18)
- Modify: `frontend/src/screens/SearchScreen.jsx` (5), `FavoritesScreen.jsx` (4), `CheatsheetsScreen.jsx` (4), `CalculatorScreen.jsx` (17), `AdminScreen.jsx` (28), `components/AdminCharts.jsx` (23), `components/ContextBar.jsx` (4), `components/StatsBar.jsx` (2), `components/SectionNav.jsx` (1), `components/FeedbackForm.jsx` (9), `components/ArticleBody.jsx` (2)

**Interfaces:**
- Consumes: классы из Task 7
- Produces: ничего для следующих задач

- [ ] **Step 1: Главная, База, Статья, Гейт**

В этих четырёх файлах:
- заменить `style={{ marginBottom: 24 }}` на класс `sect`;
- заменить обёртки списков на `<div className="stack">`;
- в `HomeScreen.jsx` строки 125-130: убрать эмодзи из чипов — было `📚 {n} статей`, стало `{n} статей`;
- в `HomeScreen.jsx` строка 88: `🔥 инструменты недели` → `инструменты недели`;
- в `HomeScreen.jsx` строка 102: `⭐ {t.stars}` → `★ {t.stars}` (типографский символ, не эмодзи);
- в `HomeScreen.jsx` строки 30-41: инлайновый стиль кнопки админки заменить на `className="chip"`, текст `🔒 admin` → `админка`;
- карточкам разделов «новое на неделе» добавить обложки: `<div className="card__cover" />`, `<div className="card__cover card__cover--green" />`, `<div className="card__cover card__cover--violet" />` по кругу через индекс — `["", "card__cover--green", "card__cover--violet"][i % 3]`;
- содержимое карточек обернуть в `<div className="card__pad">`;
- в `EntryScreen.jsx` обернуть тело статьи в `<div className="sheet">`.

- [ ] **Step 2: Проверить и закоммитить первую группу**

Run: `cd frontend && npx oxlint && npm run build && npm run dev`
Expected: 0 error; build проходит; Главная показывает карточки с цветными обложками, эмодзи в чипах нет.

```bash
git add frontend/src/screens/HomeScreen.jsx frontend/src/screens/EntriesListScreen.jsx frontend/src/screens/EntryScreen.jsx frontend/src/screens/GateScreen.jsx
git commit -m "$(cat <<'EOF'
refactor(ui): Главная, База, Статья и Гейт на классах вместо инлайн-стилей

Эмодзи-иконки убраны, карточки получили обложки-градиенты по разделам,
тело статьи переехало на .sheet.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Софт, Промпты, Гид**

В `ToolsListScreen.jsx`, `ToolDetail.jsx`, `ComponentDetail.jsx`, `PromptsListScreen.jsx`, `GuideTrack.jsx`:
- инлайновые стили → классы `card`, `card__pad`, `card__row`, `card__meta`, `stack`, `sect`;
- `⭐ {t.stars}` → `★ {t.stars}` в `ToolsListScreen.jsx:184` и `ToolDetail.jsx`;
- в `ComponentDetail.jsx:60` заменить `"📋 копировать npx"` на `"Копировать npx"`, а `"✓ скопировано"` на `"Скопировано"`;
- в `SectionNav.jsx` удалить `<span className="tree-item">{i === groups.length - 1 ? "└──" : "├──"}</span>` целиком вместе с вычислением индекса.

- [ ] **Step 4: Проверить и закоммитить вторую группу**

Run: `cd frontend && npx oxlint && npm run build && npm run dev`
Expected: 0 error; build проходит; в списках групп нет символов `├── └──`.

```bash
git add frontend/src/screens/ToolsListScreen.jsx frontend/src/screens/ToolDetail.jsx frontend/src/screens/ComponentDetail.jsx frontend/src/screens/PromptsListScreen.jsx frontend/src/components/GuideTrack.jsx frontend/src/components/SectionNav.jsx
git commit -m "$(cat <<'EOF'
refactor(ui): Софт, Промпты и Гид на классах, дерево ├── └── убрано

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Поиск, Моё, Шпаргалки, Калькулятор, Админка**

- в `SearchScreen.jsx:7`, `FavoritesScreen.jsx:7`, `AdminScreen.jsx:8` заменить карты эмодзи на текстовые метки: `const TYPE_LABEL = { entry: "статья", tool: "инструмент", prompt: "промпт", guide: "урок", component: "компонент" };` и рендерить их как `<span className="chip">{TYPE_LABEL[item.type]}</span>`;
- в `AdminScreen.jsx:48-49` убрать эмодзи из подписей табов: `"🔥 интересы"` → `"интересы"`, `` `👥 users (${users.length})` `` → `` `users (${users.length})` ``;
- `ContextBar.jsx` перевести на классы `context-bar`, `context-bar__head`, `context-bar__track`, `context-bar__fill`, добавив их в `global.css`;
- `StatsBar.jsx`: убрать эмодзи из вызовов `<Segment icon="📚" .../>` — удалить проп `icon` из компонента и из всех пяти вызовов, добавить `fontVariantNumeric: "tabular-nums"` через класс `stat`;
- `AdminScreen.jsx` и `AdminCharts.jsx` — минимальный проход: только замена цветовых литералов на токены, раскладку не трогать.

- [ ] **Step 6: Убедиться, что эмодзи-иконок не осталось**

Run: `cd frontend && grep -rn "📚\|🔧\|✨\|📋\|👥\|🔥\|⭐\|🔍\|🛠\|⚡\|🔒\|📖\|🧩" src/ || echo "эмодзи-иконок нет"`
Expected: `эмодзи-иконок нет`.

- [ ] **Step 7: Посчитать остаток инлайн-стилей**

Run: `cd frontend && grep -rc "style={{" --include="*.jsx" src/ | grep -v ":0" | sort -t: -k2 -rn`
Expected: остаются только динамические стили, где значение вычисляется в рантайме (ширина полосы прогресса, высота столбца графика). Статических `style={{ marginBottom: 24 }}` быть не должно.

- [ ] **Step 8: Проверить и закоммитить третью группу**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 12 тестов зелёные; build проходит.

```bash
git add frontend/src/screens/ frontend/src/components/
git commit -m "$(cat <<'EOF'
refactor(ui): Поиск, Моё, Шпаргалки, Калькулятор и Админка на классах

Эмодзи-иконки заменены текстовыми метками во всех оставшихся местах.
ContextBar и StatsBar переведены на классы и токены.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Настройки и выбор варианта фона

Чистая логика перед тем, как трогать пиксели. Оба модуля тестируются.

**Files:**
- Create: `frontend/src/lib/prefs.js`
- Test: `frontend/src/lib/prefs.test.js`
- Create: `frontend/src/lib/background.js`
- Test: `frontend/src/lib/background.test.js`

**Interfaces:**
- Consumes: ничего
- Produces:
  - `getAmbientEnabled()` → `boolean`. По умолчанию `true`. Читает ключ `baza:ambient` из `localStorage`, не падает, если хранилище недоступно.
  - `setAmbientEnabled(value: boolean)` → `void`.
  - `VIDEO_SCREENS` → `["gate", "home"]`.
  - `resolveVariant({ screen, enabled, reducedMotion })` → `"video" | "dust" | "wash"`.

- [ ] **Step 1: Написать падающие тесты**

Создать `frontend/src/lib/prefs.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { getAmbientEnabled, setAmbientEnabled } from "./prefs";

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
```

Создать `frontend/src/lib/background.test.js`:

```js
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
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `cd frontend && npm test`
Expected: FAIL — `Failed to resolve import "./prefs"` и `"./background"`.

- [ ] **Step 3: Написать модули**

Создать `frontend/src/lib/prefs.js`:

```js
const KEY = "baza:ambient";

// Живой фон включён по умолчанию. Выключенным считаем только явное "0" —
// любой мусор в хранилище трактуем как «включено», чтобы сломанное
// значение не отбирало у человека оформление молча.
export function getAmbientEnabled() {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setAmbientEnabled(value) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // приватный режим — настройка просто не переживёт сессию
  }
}
```

Создать `frontend/src/lib/background.js`:

```js
// Видео крутится только на витрине: гейт-экран и Главная. На списках и
// статьях — canvas-пыль, она стоит 3 КБ вместо 439 и не мешает читать.
export const VIDEO_SCREENS = ["gate", "home"];

export function resolveVariant({ screen, enabled, reducedMotion }) {
  if (reducedMotion || !enabled) return "wash";
  return VIDEO_SCREENS.includes(screen) ? "video" : "dust";
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что они проходят**

Run: `cd frontend && npm test`
Expected: PASS — 21 тест зелёный (12 прежних + 9 новых).

- [ ] **Step 5: Коммит**

```bash
git add frontend/src/lib/prefs.js frontend/src/lib/prefs.test.js frontend/src/lib/background.js frontend/src/lib/background.test.js
git commit -m "$(cat <<'EOF'
feat(ui): логика выбора фона и настройка живого фона

resolveVariant решает video/dust/wash по экрану, настройке и
prefers-reduced-motion. Видео — только гейт и Главная.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Canvas-пыль

**Files:**
- Create: `frontend/src/lib/dust.js`
- Test: `frontend/src/lib/dust.test.js`
- Create: `frontend/src/components/AmbientBackground.jsx`
- Create: `frontend/src/styles/background.css`
- Modify: `frontend/src/styles/global.css` (добавить импорт)
- Modify: `frontend/src/App.jsx:106-160`

**Interfaces:**
- Consumes: `resolveVariant`, `VIDEO_SCREENS` (Task 9), `getAmbientEnabled` (Task 9)
- Produces:
  - `createDust({ width, height })` → массив частиц `{ x, y, r, bokeh, vy, sway, phase, alpha, color }`
  - `stepDust(particles, dt, width, height)` → `void`, мутирует частицы на месте
  - `<AmbientBackground screen={string} />` — сам решает вариант, сам подписывается на `prefers-reduced-motion`

- [ ] **Step 1: Написать падающий тест**

Создать `frontend/src/lib/dust.test.js`:

```js
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
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd frontend && npm test`
Expected: FAIL — `Failed to resolve import "./dust"`.

- [ ] **Step 3: Написать модуль частиц**

Создать `frontend/src/lib/dust.js`:

```js
// Угольки: тёплые частицы, всплывающие вверх с боковым дрейфом.
// Настроение то же, что у видео-фона, но 3 КБ вместо 439 —
// поэтому именно этот вариант стоит на длинных списках и статьях.

const COLORS = [
  [224, 130, 86],
  [242, 176, 116],
  [255, 214, 160],
];

const AREA_PER_PARTICLE = 2200;

export function createDust({ width, height }) {
  const count = Math.round((width * height) / AREA_PER_PARTICLE);
  return Array.from({ length: count }, () => {
    const bokeh = Math.random() < 0.2;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: bokeh ? 5 + Math.random() * 11 : 0.7 + Math.random() * 1.8,
      bokeh,
      vy: -(0.08 + Math.random() * 0.32),
      sway: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      alpha: bokeh ? 0.2 + Math.random() * 0.3 : 0.4 + Math.random() * 0.5,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    };
  });
}

export function stepDust(particles, dt, width, height) {
  for (const p of particles) {
    p.y += p.vy * dt;
    p.phase += 0.012 * dt;
    if (p.y < -12) {
      p.y = height + 12;
      p.x = Math.random() * width;
    }
  }
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

Run: `cd frontend && npm test`
Expected: PASS — 28 тестов зелёные.

- [ ] **Step 5: Написать стили фона**

Создать `frontend/src/styles/background.css`:

```css
/* Слой фона. Лежит под всем контентом и не ловит указатель. */

.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.ambient__wash {
  position: absolute;
  inset: -20%;
}

.ambient__wash i {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(50px);
  will-change: transform;
}

.ambient__wash i:nth-child(1) {
  width: 320px;
  height: 320px;
  top: 0;
  right: -14%;
  background: #A8623A;
  opacity: 0.5;
  animation: ambient-drift-1 30s ease-in-out infinite;
}

.ambient__wash i:nth-child(2) {
  width: 300px;
  height: 300px;
  bottom: 2%;
  left: -16%;
  background: #3E5340;
  opacity: 0.45;
  animation: ambient-drift-2 36s ease-in-out infinite;
}

@keyframes ambient-drift-1 {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-26px, 34px, 0) scale(1.12); }
}

@keyframes ambient-drift-2 {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1.08); }
  50% { transform: translate3d(30px, -26px, 0) scale(0.94); }
}

.ambient__video,
.ambient__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease);
}

.ambient__video {
  object-fit: cover;
  /* screen — угольки светятся поверх тёмной бумаги, а не закрывают её */
  mix-blend-mode: screen;
}

.ambient--video .ambient__video,
.ambient--dust .ambient__canvas {
  opacity: 1;
}

.ambient__grain {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>");
}

/* Контент обязан лежать выше слоя фона. */
#root > *:not(.ambient) {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .ambient__wash i {
    animation: none;
  }
}
```

В `frontend/src/styles/global.css` сразу после `@import "./tokens.css";` добавить:

```css
@import "./background.css";
```

- [ ] **Step 6: Написать компонент (пока без видео)**

Создать `frontend/src/components/AmbientBackground.jsx`:

```jsx
import { useEffect, useRef, useState } from "react";
import { resolveVariant } from "../lib/background";
import { getAmbientEnabled } from "../lib/prefs";
import { createDust, stepDust } from "../lib/dust";

export function AmbientBackground({ screen }) {
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const enabled = getAmbientEnabled();
  const variant = resolveVariant({ screen, enabled, reducedMotion });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (variant !== "dust") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let particles = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createDust({ width, height });
    };

    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      stepDust(particles, dt, width, height);
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const x = p.x + Math.sin(p.phase) * p.sway * 14;
        const [r, g, b] = p.color;
        if (p.bokeh) {
          const grd = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
          grd.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grd;
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        }
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [variant]);

  return (
    <div className={`ambient ambient--${variant}`} aria-hidden="true">
      <div className="ambient__wash">
        <i />
        <i />
      </div>
      <canvas className="ambient__canvas" ref={canvasRef} />
      <div className="ambient__grain" />
    </div>
  );
}
```

- [ ] **Step 7: Подключить в App.jsx**

В `frontend/src/App.jsx` добавить импорт после строки 16:

```jsx
import { AmbientBackground } from "./components/AmbientBackground";
```

Заменить строку 99 (ветка `gateState === "blocked"`) на:

```jsx
  if (gateState === "blocked") {
    return (
      <>
        <AmbientBackground screen="gate" />
        <GateScreen counts={home?.counts} onRecheckSuccess={() => setGateState("ok")} />
      </>
    );
  }
```

И первой строкой внутри `return (<>` на строке 107 добавить:

```jsx
      <AmbientBackground screen={screen} />
```

- [ ] **Step 8: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 28 тестов зелёные; build проходит.

- [ ] **Step 9: Посмотреть глазами**

Run: `cd frontend && npm run dev`
Expected: на всех экранах поверх тёплой заливки медленно всплывают тёплые частицы, часть из них — размытые пятна. Карточки и текст читаются, фон под ними не мешает. В DevTools включить «Emulate CSS prefers-reduced-motion: reduce» — частицы исчезают, остаётся только неподвижная заливка.

- [ ] **Step 10: Коммит**

```bash
git add frontend/src/lib/dust.js frontend/src/lib/dust.test.js frontend/src/components/AmbientBackground.jsx frontend/src/styles/background.css frontend/src/styles/global.css frontend/src/App.jsx
git commit -m "$(cat <<'EOF'
feat(ui): слой живого фона с canvas-пылью

AmbientBackground сам выбирает вариант по экрану и настройкам. Плотность
частиц считается от площади холста, пересчёт по ResizeObserver.
prefers-reduced-motion оставляет только неподвижную заливку.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Видео-угольки на витрине

**Files:**
- Create: `frontend/public/bg/embers.mp4`
- Create: `frontend/public/bg/embers-poster.jpg`
- Modify: `frontend/src/components/AmbientBackground.jsx`

**Interfaces:**
- Consumes: `AmbientBackground` из Task 10
- Produces: ничего для следующих задач

- [ ] **Step 1: Подготовить ролик**

Исходник — `bg_style_1.mp4` из `content-factory/motion-engine/backgrounds/` (вне этого репозитория, у владельца проекта). Команда решает три проблемы разом: вес 7,5 МБ, разрыв на стыке лупа и лишнюю AAC-дорожку, из-за которой Telegram блокирует автоплей.

```bash
mkdir -p frontend/public/bg
BG=~/telegram_bot/content-factory/motion-engine/backgrounds/bg_style_1.mp4

ffmpeg -v error -y -i "$BG" -an -filter_complex \
 "[0:v]scale=480:-2,fps=20,split[a][b];\
  [a]trim=0:8.8,setpts=PTS-STARTPTS[main];\
  [b]trim=8.8:10,setpts=PTS-STARTPTS[tail];\
  [main]split[m1][m2];\
  [m1]trim=0:1.2,setpts=PTS-STARTPTS[head];\
  [m2]trim=1.2:8.8,setpts=PTS-STARTPTS[rest];\
  [tail][head]blend=all_expr='A*(1-(T/1.2))+B*(T/1.2)'[mix];\
  [mix][rest]concat=n=2:v=1:a=0[out]" \
 -map "[out]" -c:v libx264 -crf 32 -preset slow -pix_fmt yuv420p \
 -movflags +faststart frontend/public/bg/embers.mp4

ffmpeg -v error -y -i frontend/public/bg/embers.mp4 -frames:v 1 -update 1 \
 -q:v 4 frontend/public/bg/embers-poster.jpg
```

- [ ] **Step 2: Проверить результат**

Run: `ls -la frontend/public/bg/ && ffprobe -v error -show_entries format=duration -show_entries stream=codec_type -of default=noprint_wrappers=1 frontend/public/bg/embers.mp4`
Expected: `embers.mp4` около 430–450 КБ, `embers-poster.jpg` — десятки КБ; `duration=8.800000`; в выводе ровно один `codec_type=video` и **ни одного** `codec_type=audio`.

- [ ] **Step 3: Добавить видео в компонент**

В `frontend/src/components/AmbientBackground.jsx` добавить `useRef` для видео и эффект управления им. После строки с `const canvasRef = useRef(null);` добавить:

```jsx
  const videoRef = useRef(null);
```

Перед `return` добавить эффект:

```jsx
  useEffect(() => {
    const video = videoRef.current;
    if (!video || variant !== "video") {
      video?.pause();
      return;
    }

    // Часть вебвью отказывает в автоплее до первого касания.
    const play = () => video.play().catch(() => {});
    play();
    const retry = () => play();
    document.addEventListener("pointerdown", retry, { once: true });

    // Без паузы при сворачивании видео жжёт батарею впустую.
    const onVisibility = () => (document.hidden ? video.pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
  }, [variant]);
```

В разметке между `.ambient__wash` и `.ambient__canvas` вставить:

```jsx
      {variant === "video" && (
        <video
          className="ambient__video"
          ref={videoRef}
          src="/bg/embers.mp4"
          poster="/bg/embers-poster.jpg"
          muted
          loop
          playsInline
          preload="none"
        />
      )}
```

Условный рендер важен: `preload="none"` не мешает браузеру начать загрузку при вставке элемента, поэтому сам элемент появляется только на витринных экранах — 439 КБ не тратятся у того, кто до Главной не дошёл.

- [ ] **Step 4: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 28 тестов зелёные; build проходит.

- [ ] **Step 5: Посмотреть глазами**

Run: `cd frontend && npm run dev`
Expected: на Главной поверх заливки идут светящиеся угольки; при переходе в «База» они сменяются canvas-пылью; в DevTools на вкладке Network видно, что `embers.mp4` запрашивается один раз и только при показе Главной. Оставить вкладку на минуту и посмотреть на стык лупа — рывка быть не должно.

- [ ] **Step 6: Коммит**

```bash
git add frontend/public/bg/ frontend/src/components/AmbientBackground.jsx
git commit -m "$(cat <<'EOF'
feat(ui): видео-угольки на гейт-экране и Главной

Ролик пережат 7,5 МБ → 439 КБ, зациклен кросс-фейдом (хвост 1,2 с на
начало), AAC-дорожка вырезана — с ней Telegram блокирует автоплей.
Элемент video монтируется только на витринных экранах, пауза по
visibilitychange, повтор play() по первому касанию.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Тумблер живого фона и снятие алиасов

Замыкающая задача: даём человеку выключатель и убираем строительные леса.

**Files:**
- Modify: `frontend/src/screens/FavoritesScreen.jsx`
- Modify: `frontend/src/styles/tokens.css` (удалить блок алиасов)
- Modify: `frontend/src/styles/global.css` (заменить оставшиеся старые имена)

**Interfaces:**
- Consumes: `getAmbientEnabled`, `setAmbientEnabled` (Task 9)
- Produces: ничего

- [ ] **Step 1: Добавить тумблер в «Моё»**

В `frontend/src/screens/FavoritesScreen.jsx` добавить импорт:

```jsx
import { getAmbientEnabled, setAmbientEnabled } from "../lib/prefs";
```

И перед списком избранного вставить секцию:

```jsx
      <section className="sect">
        <span className="eyebrow">оформление</span>
        <button
          className="btn btn--ghost"
          onClick={() => {
            setAmbientEnabled(!getAmbientEnabled());
            window.location.reload();
          }}
        >
          {getAmbientEnabled() ? "Выключить живой фон" : "Включить живой фон"}
        </button>
      </section>
```

Перезагрузка здесь осознанная: фон живёт выше по дереву, чем этот экран, и городить общий стейт ради одного тумблера — лишняя связанность.

- [ ] **Step 2: Найти оставшиеся старые имена токенов**

Run: `cd frontend && grep -rn "text-heading\|text-body\|text-muted-dim\|text-muted" src/ | grep -v "^src/styles/tokens.css"`
Expected: список мест, где ещё используются алиасы. Заменить: `--text-heading` → `--text`, `--text-body` → `--text-2`, `--text-muted` → `--text-3`, `--text-muted-dim` → `--text-3`.

- [ ] **Step 3: Удалить блок алиасов**

В `frontend/src/styles/tokens.css` удалить весь блок, начинающийся комментарием `/* ---- алиасы старых имён ---- */`, вместе с четырьмя переменными.

- [ ] **Step 4: Убедиться, что ничего не отвалилось**

Run: `cd frontend && grep -rn "text-heading\|text-body\|text-muted" src/ || echo "алиасов не осталось"`
Expected: `алиасов не осталось`.

- [ ] **Step 5: Проверить линт, тесты и сборку**

Run: `cd frontend && npx oxlint && npm test && npm run build`
Expected: 0 error; 28 тестов зелёные; build проходит.

- [ ] **Step 6: Посмотреть глазами**

Run: `cd frontend && npm run dev`
Expected: на всех экранах цвета не поехали; в «Моё» есть кнопка выключения живого фона; после нажатия и перезагрузки остаётся только неподвижная заливка, а кнопка предлагает включить обратно.

- [ ] **Step 7: Коммит**

```bash
git add frontend/src/screens/FavoritesScreen.jsx frontend/src/styles/tokens.css frontend/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(ui): выключатель живого фона, алиасы старых токенов убраны

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Проверка на устройствах и документация

Последняя задача — не косметическая. Спека содержит чек-лист из 12 пунктов, половину которых нельзя проверить в браузере.

**Files:**
- Modify: `CLAUDE.md` (строка про эстетику в разделе «Архитектура»)
- Modify: внешний `BAZA_CONTEXT.md`, §13 (вне репозитория, у владельца проекта)

**Interfaces:**
- Consumes: всё предыдущее
- Produces: ничего

- [ ] **Step 1: Снять метрики сборки**

```bash
cd frontend && npm run build
du -sh dist
ls -la dist/assets/*.css | awk '{print $NF, int($5/1024)"KB"}'
ls -la dist/bg/
```

Записать числа. Базовое состояние до работ: CSS 7 КБ, все JS вместе ~1018 КБ gzip, `dist` 25 МБ. Видео учитывается отдельно от JS-бандла — оно не проходит через сборщик.

- [ ] **Step 2: Прогнать чек-лист спеки на реальных устройствах**

Задеплоить по §12 внешнего `BAZA_CONTEXT.md` (шаг 5 — пересборка статики) и пройти по пунктам:

- [ ] Фуллскрин включается на iPhone с Dynamic Island
- [ ] Фуллскрин включается на iPhone с чёлкой
- [ ] Фуллскрин включается на Android
- [ ] На клиенте старше Bot API 8.0 приложение выглядит корректно в обычном режиме
- [ ] Заголовок не залезает под вырез
- [ ] Кнопки Telegram «✕» и «⋮» не перекрывают элементы приложения и читаются на светлых кадрах
- [ ] «Моё» в нижней навигации не перехватывается системным жестом
- [ ] Свайп вниз по статье не закрывает приложение
- [ ] Видео стартует само; если нет — стартует после первого касания
- [ ] Луп без рывка на стыке
- [ ] Пауза видео при сворачивании приложения
- [ ] `prefers-reduced-motion` отключает и видео, и canvas
- [ ] Гейт цел: `POST /api/gate/check` вручную, экран гейта и переход после подписки
- [ ] Работает локально через `docker compose up`

Любой невыполненный пункт — это баг, который чинится до объявления работы законченной, а не записывается в «потом».

- [ ] **Step 3: Поправить CLAUDE.md**

В `CLAUDE.md` в разделе «Архитектура» заменить строку про фронтенд на:

```markdown
- Frontend: React 19 + Vite, Telegram Mini App SDK, тема «Anthropic Studio» — только тёмная, полноэкранный режим Bot API 8.0, живой фон (палитра и паттерны — см. внешний BAZA_CONTEXT.md §13 и `docs/superpowers/specs/2026-07-25-anthropic-studio-redesign-design.md`)
```

- [ ] **Step 4: Переписать §13 внешнего BAZA_CONTEXT.md**

Заменить §13 целиком. Формулировка «терминал в духе oh-my-zsh» и палитра `#111110 / #d97757` больше не описывают продукт. Новый §13 должен содержать:

- палитру Anthropic Studio (список из Global Constraints этого плана);
- три гарнитуры и их роли, факт что они вшиты в бандл;
- полноэкранный режим: требования Bot API 8.0 и 7.7, поведение фоллбэка, источник инсетов и почему не `env()`;
- фон: источник роликов, параметры пережатия, схема «видео на витрине, canvas на остальном», тумблер выключения;
- явную пометку, что иконки (153 PNG) — незакрытый долг второй волны;
- ссылку на спеку и этот план в репозитории.

- [ ] **Step 5: Коммит**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: описание фронтенда приведено в соответствие с новой темой

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Самопроверка плана

**Покрытие спеки.** §2.1 палитра → Task 2. §2.2 типографика → Task 2 (с проверкой кириллицы в Literata и запасными гарнитурами). §2.3 остальные токены → Task 2. §3.1 `lib/telegram.js` → Task 3. §3.2 источник отступов → Task 1 + Task 3. §3.3 хедер, кнопка влево, скрим → Task 4; нижняя навигация → Task 5; `disableVerticalSwipes` → Task 3. §4.1 обработка ролика → Task 11 Step 1. §4.2 компонент `AmbientBackground` → Tasks 9, 10, 11; тумблер → Task 12. §5.1 новые компоненты → Tasks 4, 6, 10. §5.2 переписываемые → Tasks 5, 6, 7, 8. §5.3 удаление `PromptLine` → Task 4. §5.4 экраны → Task 8. §7 порядок работ соблюдён. §8 чек-лист → Task 13 Step 2. §9 документация → Task 13 Steps 3-4.

**Незакрытых требований спеки нет.**

**Известные ограничения плана, принятые сознательно:**

- Задачи 2, 4, 5, 6, 7, 8, 11, 12 проверяются сборкой и глазами в мок-режиме, а не юнит-тестами. Автотесты появляются только там, где есть чистая логика: инсеты, инициализация Telegram, выбор варианта фона, настройки, частицы (28 тестов суммарно). Это честное отражение §8 спеки — визуального регрессионного тестирования у проекта нет, и притворяться, что оно есть, хуже, чем назвать вещи своими именами.
- Task 8 — самая объёмная и самая скучная: 204 инлайновых стиля в 20 файлах. Она разбита на три коммита именно поэтому.
- Task 13 Step 2 требует физических устройств. Без него работа не считается законченной.
