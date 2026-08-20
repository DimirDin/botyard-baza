---
slug: cc-claude-md-excludes
title: "Монорепозиторий: как не тащить чужие инструкции"
summary: "claudeMdExcludes отсекает CLAUDE.md соседних команд, которые иначе подхватываются автоматически."
section: code
group: permissions
tags: [permissions, claude-md, monorepo, settings]
doc_url: "https://code.claude.com/docs/en/memory"
sort_order: 40
published: true
---

![Монорепозиторий](/entry-images/context-window.jpg)

### ❓ Что это

Поскольку Claude Code идёт вверх по дереву и склеивает все найденные `CLAUDE.md`, в
монорепозитории в контекст попадают файлы команд, к которым ты отношения не имеешь.
Настройка `claudeMdExcludes` пропускает их по пути или глобу:

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

Шаблоны сопоставляются с **абсолютными** путями. Настраивается на любом слое —
пользовательском, проектном, локальном или policy; массивы при этом сливаются.

### 🎯 Зачем тебе

Проблема не только в объёме контекста, но и в противоречиях: чужие правила стиля,
конфликтующие с твоими, разрешаются моделью произвольно. Отсечь их дешевле, чем спорить
с ними в своём файле.

Класть исключения стоит в `.claude/settings.local.json`, чтобы они остались на твоей машине.

### 💻 Минимальный пример

Смежная настройка для другой стороны той же проблемы — подключение дополнительных
директорий. По умолчанию `CLAUDE.md` из папок, добавленных через `--add-dir`, **не
грузятся**:

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

Это подтянет `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/*.md` и `CLAUDE.local.md`
из дополнительной директории.

### ⚠️ Грабли

- **Управляемый policy-CLAUDE.md исключить нельзя** — организационные инструкции
  применяются всегда.
- **Проверять результат надо через `/context`**, а не предполагать: список под
  **Memory files** показывает, что реально загрузилось.
- **`CLAUDE.local.md` пропускается, если исключить `local` из `--setting-sources`** —
  об этом легко забыть при отладке.

### 🔗 Первоисточник
Exclude specific CLAUDE.md files — code.claude.com/docs/en/memory
