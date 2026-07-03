---
slug: cheat-cc-claude-md-template
title: "Шаблон CLAUDE.md"
category: claude-code
sort_order: 20
---

```markdown
# [Project Name] Info

## Build & Test
- Build: `npm run build` или `poetry build`
- Test: `pytest` или `npm test`
- Lint: `ruff check .` или `eslint .`

## Code Style
- Stack: [твой стек]
- Style: strict types, functional, async
- Architecture: [твой архитектурный паттерн]

## Rules
- Never push to main directly. Always create feature/ branches.
- Use [пакетный менеджер], don't touch lock-файл вручную.
```

Держи файл коротким — это первое, что читается в каждой сессии, и он ест токены при каждом запуске.
