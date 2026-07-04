---
slug: cc-skills-vs-plugins
title: "Skills и плагины: чем расширяется Claude Code"
summary: "Разница между локальными скиллами и внешними плагинами/MCP-серверами при расширении возможностей агента."
section: code
group: skills
tags: [claude-code, skills, plugins]
doc_url: "https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md"
sort_order: 30
published: true
---

### ❓ Что это
Плагины и MCP-серверы дают Claude Code доступ к новым внешним API (БД, таск-трекеры). Skills — локальные структурированные инструкции/скрипты, которые агент использует для автоматизации многошаговых рутинных действий внутри проекта.

### 🎯 Зачем тебе
Для часто повторяющихся сложных последовательностей действий (миграция + пересборка схемы + рестарт контейнера) можно оформить skill — и в следующий раз агент выполнит её одной командой.

### 💻 Минимальный пример
```json
{
  "skills": [{
    "name": "deploy_local_replica",
    "description": "Перезапускает локальный Docker и накатывает миграции",
    "commands": [
      "docker compose down vdb",
      "docker compose up -d vdb",
      "poetry run alembic upgrade head"
    ]
  }]
}
```

### ⚠️ Грабли
Не позволяй агенту зашивать в скиллы секреты или абсолютные пути. Проверяй содержимое skills-файлов перед коммитом в общий репозиторий.

### 🔗 Первоисточник
Anthropic Claude Code Docs — Skills
