---
slug: cheat-cc-hooks-exit-codes
title: "Коды выхода и JSON-вывод хуков"
category: claude-code
sort_order: 65
---

Сверено с code.claude.com/docs/en/hooks, 20.08.2026.

### Коды выхода

| Код | Что происходит |
|---|---|
| `0` | Успех. Stdout парсится как JSON, если начинается с `{`, иначе как текст |
| `2` | **Блокирующая ошибка.** Блокирует независимо от JSON — даже `permissionDecision: "allow"` не отменит |
| Прочие | Обычно неблокирующая ошибка, действие продолжается |

Исключение: у `WorktreeCreate` **любой** ненулевой код проваливает создание.

Невалидный JSON или обычный текст на stdout — неблокирующая ошибка: действие пройдёт.

### Где stdout виден модели

Показывается Claude на `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`.
На остальных событиях уходит в отладочный лог.

### Универсальные поля JSON (принимают все события)

```json
{
  "continue": false,
  "stopReason": "текст для пользователя",
  "systemMessage": "предупреждение для Claude",
  "terminalSequence": "\u001b]0;title\u0007",
  "suppressOutput": false
}
```

`suppressOutput` ничего не делает — оставлено для совместимости.

### `onFailure`: что делать, если сам хук сломался (с 2.1.295)

| Значение | Поведение при поломке |
|---|---|
| `"continue"` (по умолчанию) | действие выполняется, показывается некритичная ошибка |
| `"block"` | действие блокируется, как при коде 2; на `PermissionRequest` — отказ |

Поломка — это: скрипт не найден, код выхода не 0 и не 2, таймаут, HTTP не 2xx, невалидный JSON.
Только для хуков `command` и `http`. Для хуков-охранников ставь `block`, иначе опечатка в пути
молча отключит защиту.

```json
{ "type": "command", "command": "./guard.sh", "onFailure": "block" }
```

### Поля решений

| Поле | Значения | События |
|---|---|---|
| `decision` | `allow`, `deny`, `escalate` | `PermissionRequest`, `PermissionDenied` |
| `permissionDecision` | `allow`, `deny` | `PreToolUse`, `PermissionRequest` |
| `additionalContext` | строка | пост-инструментные, `Stop` |
| `updatedInput` | объект | изменённый вход инструмента |

Решения кладутся в `hookSpecificOutput` с обязательным `hookEventName`:

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "deny" } }
```

### Где живут настройки хуков

| Файл | Область | Коммитится |
|---|---|---|
| `~/.claude/settings.json` | Все проекты | нет |
| `.claude/settings.json` | Проект | да |
| `.claude/settings.local.json` | Проект | нет, в gitignore |
| Managed policy | Организация | админом |
| `hooks/hooks.json` плагина | При включённом плагине | да |
