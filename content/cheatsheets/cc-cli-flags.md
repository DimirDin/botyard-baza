---
slug: cheat-cc-cli-flags
title: "CLI-флаги Claude Code"
category: claude-code
sort_order: 40
---

Сверено с code.claude.com/docs/en/cli-reference, 04.07.2026. `claude --help` показывает не все флаги — их отсутствие в help не значит, что флага нет.

### Базовые
| Флаг | Что делает | Пример |
|---|---|---|
| -p, --print | Ответ без интерактивного режима (для скриптов/CI) | `claude -p "explain this"` |
| -c, --continue | Продолжить последний диалог в текущей директории | `claude -c` |
| -r, --resume | Восстановить сессию по ID/имени или открыть пикер | `claude -r "auth-refactor"` |
| --model | Модель на сессию: алиас (sonnet/opus/haiku/fable) или полное имя | `claude --model claude-sonnet-5` |
| --permission-mode | Стартовый режим: default/acceptEdits/plan/auto/dontAsk/bypassPermissions | `claude --permission-mode plan` |

### Безопасность и лимиты
| Флаг | Что делает |
|---|---|
| --dangerously-skip-permissions | Пропустить все подтверждения (= bypassPermissions) |
| --max-turns | Лимит агентных ходов (только в -p режиме) |
| --max-budget-usd | Максимум долларов на сессию до остановки (только -p) |
| --add-dir | Дать доступ к дополнительным директориям для чтения/правки |
| --tools | Ограничить встроенные инструменты: "" — все выключить, "Bash,Edit,Read" — конкретные |

### Автоматизация
| Флаг | Что делает |
|---|---|
| --output-format | text / json / stream-json (для -p режима) |
| --bare | Минимальный старт: без хуков, скиллов, плагинов, MCP, auto memory — быстрее для скриптов |
| --fallback-model | Автопереход на другую модель при перегрузке основной |
| --settings | Путь к settings.json или инлайн JSON, переопределяет ключи на сессию |
