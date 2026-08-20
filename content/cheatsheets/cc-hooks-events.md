---
slug: cheat-cc-hooks-events
title: "События хуков Claude Code"
category: claude-code
sort_order: 60
---

Сверено с code.claude.com/docs/en/hooks, 20.08.2026.

### Все события по группам

| Группа | События |
|---|---|
| Сессия | `SessionStart`, `SessionEnd` |
| Ход | `UserPromptSubmit`, `Stop`, `StopFailure` |
| Цикл инструментов | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`, `UserPromptExpansion`, `Elicitation` |
| Асинхронные | `FileChanged`, `CwdChanged`, `DirectoryAdded`, `ConfigChange`, `InstructionsLoaded`, `WorktreeCreate`, `WorktreeRemove`, `Notification` |
| Агенты и задачи | `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted` |
| Прочие | `TeammateIdle`, `PreCompact`, `PostCompact`, `ElicitationResult`, `MessageDisplay` |

### С чем сравнивается matcher

| Событие | Значение matcher |
|---|---|
| Инструментные | Имя инструмента: `Bash`, `Edit\|Write`, `mcp__memory__.*` |
| `SessionStart` | `startup`, `resume`, `clear`, `compact`, `fork` |
| `SessionEnd` | `clear`, `resume`, `logout`, `other` |
| `SubagentStart/Stop` | Тип агента: `general-purpose`, `Explore`, своё имя |
| `PreCompact` / `PostCompact` | `manual`, `auto` |
| `FileChanged` | Имена файлов: `.envrc\|.env` |
| `Notification` | `permission_prompt`, `auth_success`, `elicitation_dialog` |
| `ConfigChange` | `user_settings`, `project_settings`, `policy_settings` |
| `StopFailure` | `rate_limit`, `authentication_failed`, `server_error` |
| `InstructionsLoaded` | `session_start`, `nested_traversal`, `include` |
| `CwdChanged`, `UserPromptSubmit`, `PostToolBatch` | Матчер не поддерживается — срабатывает всегда |

### Как интерпретируется строка matcher

| Значение | Как читается |
|---|---|
| `"*"`, `""`, отсутствует | Совпадает со всем |
| Буквы, `_`, `-`, пробелы, `,`, `\|` | Точная строка или список |
| Любые другие символы | Регулярное выражение JS **без якорей** |

### Типы обработчиков и таймауты

| Тип | Таймаут по умолчанию |
|---|---|
| `command`, `http`, `mcp_tool` | 600 с |
| — на `UserPromptSubmit` | 30 с |
| — на `MessageDisplay` | 10 с |
| `prompt` | 30 с |
| `agent` | 60 с |
| `SessionEnd` | 1,5 с — общий бюджет на все хуки события |

MCP-инструменты матчатся как `mcp__<сервер>__<инструмент>`; для плагинов — `mcp__plugin_<плагин>_<сервер>__<инструмент>`.
