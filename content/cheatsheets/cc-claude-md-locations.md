---
slug: cheat-cc-claude-md-locations
title: "CLAUDE.md: расположения, порядок, лимиты"
category: claude-code
sort_order: 45
---

Сверено с code.claude.com/docs/en/memory, 20.08.2026.

### Где может лежать (в порядке загрузки, от широкого к узкому)

| Область | Путь |
|---|---|
| Managed policy | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md` · Linux/WSL `/etc/claude-code/CLAUDE.md` · Windows `C:\Program Files\ClaudeCode\CLAUDE.md` |
| Пользовательская | `~/.claude/CLAUDE.md` |
| Проектная | `./CLAUDE.md` или `./.claude/CLAUDE.md` |
| Локальная | `./CLAUDE.local.md` (в `.gitignore`) |

### Как загружается

- Claude идёт **вверх** по дереву от рабочей директории, собирая `CLAUDE.md` и `CLAUDE.local.md`.
- Все найденные файлы **склеиваются**, а не переопределяют друг друга.
- Порядок — от корня ФС вниз к рабочей директории: ближний к тебе читается последним.
- Внутри директории `CLAUDE.local.md` идёт после `CLAUDE.md`.
- Файлы в **под**директориях грузятся по требованию — когда Claude читает файлы оттуда.
- Блочные HTML-комментарии вырезаются до попадания в контекст.

### Размер

Цель — **менее 200 строк** на файл. Длиннее — больше контекста и хуже соблюдение.
CLAUDE.md грузится целиком независимо от длины (лимит 200 строк / 25 КБ — только у `MEMORY.md` автопамяти).

### Импорты

```text
See @README for overview and @package.json for npm commands.
- git workflow @docs/git-instructions.md
```

- Относительные пути — от файла с импортом, не от рабочей директории.
- Максимум **4 прыжка** рекурсии.
- Импорт внутри код-блока или обратных кавычек не срабатывает.
- Импорты **не экономят контекст** — импортированное грузится на старте.
- Внешний импорт (за пределы рабочей директории) один раз спрашивает разрешение.

### Полезные команды и настройки

| Что | Как |
|---|---|
| Что реально загрузилось | `/context` → раздел **Memory files** |
| Открыть и править | `/memory` |
| Сгенерировать стартовый | `/init` |
| Исключить чужие файлы | `claudeMdExcludes` (глобы по абсолютным путям) |
| Подтянуть из `--add-dir` | `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` |
| AGENTS.md вместо дубля | `@AGENTS.md` импортом в CLAUDE.md |

Managed policy CLAUDE.md исключить нельзя.
