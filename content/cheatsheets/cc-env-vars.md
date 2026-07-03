---
slug: cheat-cc-env-vars
title: "Переменные окружения Claude Code"
category: claude-code
sort_order: 60
---

Сверено с code.claude.com/docs/en/env-vars, 04.07.2026. Полный список — десятки переменных, здесь только практический минимум для ежедневной работы.

| Переменная | Назначение |
|---|---|
| ANTHROPIC_API_KEY | API-ключ вместо подписки Claude Pro/Max/Team |
| ANTHROPIC_MODEL | Модель по умолчанию для новых сессий |
| ANTHROPIC_BASE_URL | Роутинг через прокси/гейтвей вместо api.anthropic.com |
| API_TIMEOUT_MS | Таймаут запроса (по умолчанию 600000 = 10 мин) |
| BASH_DEFAULT_TIMEOUT_MS | Таймаут bash-команд (по умолчанию 120000 = 2 мин) |
| CLAUDE_CODE_DISABLE_AUTO_MEMORY | `1` — выключить авто-память между сессиями |
| CLAUDE_CODE_DISABLE_CLAUDE_MDS | `1` — не загружать CLAUDE.md вообще |
| CLAUDE_CODE_EFFORT_LEVEL | low/medium/high/xhigh/max/auto — глубина рассуждения |

Приоритет: переменная окружения > поле в settings.json, там где дублируются. `--model`/`/model` в свою очередь перебивают ANTHROPIC_MODEL.

Установка: в шелл-профиле (`~/.zshrc`) — на все сессии, или в `.claude/settings.json` под ключом `env` — переносимо между машинами через git.
