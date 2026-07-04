---
slug: cc-headless-ci-cd
title: "Headless-режим и интеграция в CI/CD"
summary: "Запуск Claude Code без интерактивного UI — для автономного ревью, рефакторинга и генерации тестов в пайплайнах."
section: code
group: headless-ci
tags: [claude-code, ci-cd, github-actions]
doc_url: "https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md"
sort_order: 60
published: true
---

### ❓ Что это
Headless-режим запускает Claude Code без участия человека: задача приходит аргументами командной строки, агент отрабатывает автономно и возвращает код выхода (0 — успех, 1 — ошибка).

### 🎯 Зачем тебе
Позволяет встроить агента в GitHub Actions/GitLab CI — на каждый PR автоматически запускается ревью кода, исправление опечаток или генерация недостающих тестов до того, как к делу подключится человек.

### 💻 Минимальный пример
```yaml
name: Claude Code Auto-Review
on:
  pull_request:
    branches: [ main ]
jobs:
  claude_review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @anthropic-ai/claude-code
      - env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: claude-code --non-interactive "Проверь изменения в ветке, найди критичные баги, верни код 1 если есть"
```

### ⚠️ Грабли
Ограничивай бюджет токенов и таймаут шага CI. При циклической ошибке сборки headless-агент может бесконечно пытаться её исправить и выжечь весь баланс за минуты.

### 🔗 Первоисточник
Anthropic Claude Code Docs — Non-interactive mode
