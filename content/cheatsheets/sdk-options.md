---
slug: cheat-sdk-options
title: "Опции Claude Agent SDK"
category: api
sort_order: 70
---

Сверено с code.claude.com/docs/en/agent-sdk, 20.08.2026.

### Установка

```bash
npm install @anthropic-ai/claude-agent-sdk   # TypeScript
pip install claude-agent-sdk                 # Python
export ANTHROPIC_API_KEY=...                 # .env сам не читается
```

### Ключевые опции

| Python | TypeScript | Что делает |
|---|---|---|
| `allowed_tools` | `allowedTools` | Автоодобрение перечисленных инструментов |
| `disallowed_tools` | `disallowedTools` | Жёсткая блокировка |
| `permission_mode` | `permissionMode` | Уровень надзора (таблица ниже) |
| `max_turns` | `maxTurns` | Потолок ходов с вызовом инструментов |
| `max_budget_usd` | `maxBudgetUsd` | Потолок трат (включая сабагентов) |
| `effort` | `effort` | Глубина рассуждения |
| `setting_sources` | `settingSources` | Откуда брать CLAUDE.md, скиллы, хуки |
| `system_prompt` | `systemPrompt` | Свой системный промпт |
| `model` | `model` | Явная модель вместо дефолта |

### Режимы разрешений

| Режим | Поведение |
|---|---|
| `default` | Не покрытое allow-правилами → в `canUseTool`; нет колбэка = отказ |
| `acceptEdits` | Автоодобряет правки файлов и `mkdir`/`touch`/`mv`/`cp` |
| `plan` | Исследует и планирует, исходники не правит |
| `dontAsk` | Никогда не спрашивает: разрешённое правилами выполняется, остальное отклоняется |
| `auto` | Классификатор-модель решает |
| `bypassPermissions` | Без вопросов. Только изолированные среды; в TS требует `allowDangerouslySkipPermissions: true`; не работает под root |

### Уровни effort

| Уровень | Для чего |
|---|---|
| `low` | Поиск файлов, листинги |
| `medium` | Рутинные правки |
| `high` | Рефакторинги, отладка |
| `xhigh` | Кодинг и агентные задачи; рекомендован на Fable 5, Opus 4.7+, Sonnet 5 |
| `max` | Многошаговые задачи с глубоким анализом |

### Наборы инструментов

| Инструменты | Класс агента |
|---|---|
| `Read`, `Glob`, `Grep` | Только чтение |
| `Read`, `Edit`, `Glob` | Анализ и правка |
| `Read`, `Edit`, `Bash`, `Glob`, `Grep` | Полная автоматизация |

Сужение по аргументам: `"Bash(npm *)"`.
