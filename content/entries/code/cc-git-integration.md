---
slug: cc-git-integration
title: "Git-автоматизация: коммиты, ветки, PR"
summary: "Как заставить Claude Code самостоятельно создавать ветки, писать семантические коммиты и оформлять пулл-реквесты."
section: code
group: claude-code
tags: [claude-code, git, automation]
doc_url: "https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md"
sort_order: 80
published: true
---

### ❓ Что это
Claude Code нативно взаимодействует с git: видит рабочее дерево, стейдж, diff, и может самостоятельно вести жизненный цикл фичи от создания ветки до финального коммита.

### 🎯 Зачем тебе
Избавляет от рутины ручного разбиения задачи на коммиты. Агент группирует изменения по логическим модулям и пишет структурированные сообщения по Conventional Commits.

### 💻 Минимальный пример
```
Юзер: "Создай ветку для JWT-авторизации, напиши код и закоммить"

[cc] git checkout -b feature/jwt-auth
[cc] изменяю: auth.py, models.py
[cc] git add auth.py models.py
[cc] коммит:
feat(auth): implement JWT token generation and verification
```

### ⚠️ Грабли
Агент может закоммитить лишнее — временные логи, файлы IDE, если они не прописаны в .gitignore. Перед push всегда делай `git diff --staged` вручную.

### 🔗 Первоисточник
Anthropic Claude Code Docs — Git Workflow
