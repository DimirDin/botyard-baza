---
slug: cc-claude-md-config
title: "Инструкции проекта через CLAUDE.md"
summary: "Главный конфигурационный файл локального контекста, который Клод читает перед стартом любой задачи в репозитории."
section: code
tags: [claude-code, claude-md, configuration]
doc_url: "https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md"
sort_order: 20
published: true
---

### ❓ Что это
CLAUDE.md — конфигурационный Markdown-файл в корне репозитория. Claude Code считывает его в начале каждой сессии, чтобы понять структуру проекта, команды сборки и стайл-гайд.

### 🎯 Зачем тебе
Без файла агент каждый раз гадает, какой пакетный менеджер используется, как запускать тесты и какие линтеры стоят. Один раз описав это, экономишь токены на каждом запросе и получаешь код в едином стиле.

### 💻 Минимальный пример
```markdown
# Project Instructions (FastAPI Core)

## Build & Test
- Install: `poetry install`
- Dev server: `poetry run uvicorn main:app --reload`
- Tests: `poetry run pytest`
- Lint: `poetry run black . && poetry run ruff check .`

## Code Style
- Python 3.11+, explicit type hints везде.
- Архитектура: Routers -> Services -> Repositories.
- Async для всех БД-вызовов и роутов.
```

### ⚠️ Грабли
Не раздувай CLAUDE.md — большой файл забивает контекстное окно и увеличивает стоимость каждого ответа. Пиши только сухие факты и команды.

### 🔗 Первоисточник
Anthropic Claude Code Docs
