---
slug: cc-hooks-events-map
title: "Карта событий хуков: их сильно больше, чем кажется"
summary: "Не пять точек вокруг инструментов, а почти три десятка событий — от старта сессии до простоя тиммейта."
section: code
group: hooks
tags: [hooks, automation, events]
doc_url: "https://code.claude.com/docs/en/hooks"
sort_order: 30
published: true
---

![Карта хуков](/entry-images/agent-loop.jpg)

### ❓ Что это

Хуки обычно знают по `PreToolUse` и `PostToolUse`, но событий заметно больше:

| Группа | События |
|---|---|
| Сессия | `SessionStart`, `SessionEnd` |
| Ход | `UserPromptSubmit`, `Stop`, `StopFailure` |
| Цикл инструментов | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`, `UserPromptExpansion`, `Elicitation` |
| Асинхронные | `FileChanged`, `CwdChanged`, `DirectoryAdded`, `ConfigChange`, `InstructionsLoaded`, `WorktreeCreate`, `WorktreeRemove`, `Notification` |
| Агенты и задачи | `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted` |
| Прочие | `TeammateIdle`, `PreCompact`, `PostCompact`, `ElicitationResult`, `MessageDisplay` |

### 🎯 Зачем тебе

Матчер сравнивается с разным в зависимости от события — и это главный источник путаницы:

| Событие | С чем сравнивается matcher |
|---|---|
| Инструментные | Имя инструмента: `Bash`, `Edit\|Write`, `mcp__memory__.*` |
| `SessionStart` | Как стартовала сессия: `startup`, `resume`, `clear`, `compact`, `fork` |
| `SubagentStart/Stop` | Тип агента: `general-purpose`, `Explore`, своё имя |
| `PreCompact`/`PostCompact` | Триггер: `manual`, `auto` |
| `FileChanged` | Литеральные имена файлов: `.envrc\|.env` |
| `CwdChanged`, `UserPromptSubmit` и др. | Матчер не поддерживают — срабатывают всегда |

### 💻 Минимальный пример

Значение матчера интерпретируется по-разному в зависимости от символов в нём:

```
"*", "" или отсутствует        → совпадает со всем
буквы, _, -, пробелы, ",", "|" → точная строка или список: Bash, Edit|Write
любые другие символы           → регулярное выражение JS без якорей: ^Notebook
```

Обработчик бывает не только шеллом: `command`, `http`, `mcp_tool`, `prompt` (оценка
моделью) и `agent` (сабагент с инструментами).

### ⚠️ Грабли

- **Таймауты разные.** `command`/`http`/`mcp_tool` — 600 c, но `UserPromptSubmit` урезан
  до 30 c, а `MessageDisplay` — до 10 c. У `SessionEnd` общий бюджет 1,5 с на все хуки.
- **`InstructionsLoaded` — лучший инструмент отладки CLAUDE.md**, а не экзотика: он
  показывает, какие файлы инструкций загрузились, когда и почему.
- **Точка не совпадает с интуицией.** `PostToolUse` срабатывает после **успешного**
  вызова; для упавших есть отдельный `PostToolUseFailure`.

### 🔗 Первоисточник
Hooks reference — code.claude.com/docs/en/hooks
