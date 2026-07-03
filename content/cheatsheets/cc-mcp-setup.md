---
slug: cheat-cc-mcp-setup
title: "Подключение MCP-серверов: команды и файлы"
category: claude-code
sort_order: 70
---

Сверено с code.claude.com/docs/en/mcp-quickstart, 04.07.2026.

### Команды
| Команда | Что делает |
|---|---|
| `claude mcp add --transport http <имя> <url>` | Подключить хостед-сервер по HTTP |
| `claude mcp add <имя> -- npx -y <пакет>` | Подключить локальный stdio-сервер (всё после `--` — команда запуска) |
| `claude mcp list` | Статус всех подключённых серверов |
| `claude mcp get <имя>` | В каком scope хранится сервер |
| `claude mcp remove <имя>` | Отключить сервер |
| `/mcp` (внутри сессии) | Панель управления, реконнект, OAuth-логин |

### Scope (где хранится конфиг)
| Scope | Файл | Кому доступен |
|---|---|---|
| local (по умолчанию) | `~/.claude.json`, запись проекта | только тебе, только в этом проекте |
| project | `.mcp.json` в корне проекта | всем, кто клонирует репо — коммить в git |
| user | `~/.claude.json`, ключ `mcpServers` | только тебе, во всех проектах |

### Формат .mcp.json (для project scope, коммитится в репо)
```json
{
  "mcpServers": {
    "имя-сервера": {
      "type": "http",
      "url": "https://example.com/mcp"
    },
    "локальный-сервер": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@пакет/mcp-сервер"]
    }
  }
}
```

⚠️ Реальный путь конфига — `~/.claude.json` или `.mcp.json` в корне проекта. Пути вида `~/.config/claude-code/config.json`, которые встречаются в сторонних гайдах — устаревшие или неверные.
