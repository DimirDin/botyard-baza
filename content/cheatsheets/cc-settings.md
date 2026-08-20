---
slug: cheat-cc-settings
title: "Файлы настроек и приоритет"
category: claude-code
sort_order: 42
---

Сверено с code.claude.com/docs/en/settings, 20.08.2026.

### Где лежат

| Область | Путь | На кого действует |
|---|---|---|
| Managed | `managed-settings.json` (плюс plist/registry) | Вся организация, наивысший приоритет |
| Пользовательская | `~/.claude/settings.json` | Все твои проекты |
| Проектная | `.claude/settings.json` | Команда, коммитится в git |
| Локальная | `.claude/settings.local.json` | Только твоя машина, в gitignore |

### Приоритет (от высшего к низшему)

1. Managed settings — **переопределить нельзя**
2. Аргументы командной строки
3. Локальные `.claude/settings.local.json`
4. Проектные `.claude/settings.json`
5. Пользовательские `~/.claude/settings.json`

### Часто используемые ключи

| Ключ | Назначение |
|---|---|
| `model` | Модель по умолчанию |
| `availableModels` | Ограничить выбор моделей |
| `permissions.allow` | Разрешённые инструменты и команды (шаблоны) |
| `permissions.deny` | Заблокированные |
| `permissions.ask` | Требующие подтверждения |
| `autoMode` | Правила классификатора автоодобрения |
| `disableAutoMode` | Запретить включение auto-режима |
| `env` | Переменные окружения |
| `hooks` | Пользовательские скрипты на события |
| `autoMemoryEnabled` | Автопамять вкл/выкл |
| `autoCompactEnabled` | Автокомпактация (по умолчанию `true`) |
| `alwaysThinkingEnabled` | Extended thinking по умолчанию |
| `defaultShell` | `"bash"` или `"powershell"` |
| `claudeMd` | Общая для организации память (только managed) |
| `claudeMdExcludes` | Пропустить чужие CLAUDE.md по глобам |
| `disableBundledSkills` | Скрыть встроенные скиллы |
| `allowedMcpServers` / `deniedMcpServers` | Списки MCP-серверов (allow — managed) |
| `disableArtifact` | Выключить артефакты |
| `autoMemoryDirectory` | Своё расположение автопамяти |

**Правило разделения:** технические запреты — в настройках (`permissions.deny`, `sandbox.enabled`),
поведенческие указания — в CLAUDE.md. Настройки применяются клиентом независимо от решения модели.
