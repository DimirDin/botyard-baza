---
slug: cc-github-actions
title: "Claude Code GitHub Actions: @claude в PR и issue"
summary: "Упоминаешь @claude — он анализирует код, чинит баги, открывает PR по стандартам проекта."
section: code
group: headless-ci
tags: [claude-code, ci-cd, github]
doc_url: "https://docs.claude.com/en/docs/claude-code/github-actions"
sort_order: 153
published: true
---

![GitHub Actions](/entry-images/agent-loop.jpg)

### ❓ Что это

Интеграция Claude Code в GitHub Actions: упоминание `@claude` в комментарии PR или issue триггерит
workflow, где агент анализирует контекст (сам PR/issue, связанный код), выполняет запрошенное
действие (починить баг, ответить на вопрос, предложить рефакторинг) и либо комментирует результат,
либо открывает новый PR по стандартам проекта — весь процесс идёт в CI-окружении, без локального
участия разработчика.

### 🎯 Зачем тебе

Автоматизация рутинных запросов ревьюеров («@claude почини этот failing test»), быстрая первая
итерация на простые issue без ожидания, пока разработчик возьмёт задачу в работу, автоматический ответ
на вопросы контрибьюторов по стилю кода проекта. Особенно полезно для open-source репозиториев с
большим потоком issue, где не на каждый хватает времени мейнтейнера сразу.

### 💻 Минимальный пример

```yaml
# .github/workflows/claude.yml
on:
  issue_comment:
    types: [created]
jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### ⚠️ Грабли

- **Требует явного `ANTHROPIC_API_KEY` в секретах репозитория** — без него workflow падает на
  аутентификации, ничего не сообщая пользователю в комментарии по умолчанию, если не настроено иначе.
- **Автоматически открытые PR всё равно требуют человеческого ревью** — CI-контекст не даёт агенту
  больше доверия, чем локальная сессия, просто другой способ запуска.
- **Права токена GitHub Actions должны быть узко ограничены** — по умолчанию action не должен иметь
  прав на прямой push в защищённые ветки без явной настройки review-required политики.

### 🔗 Первоисточник
Claude Code GitHub Actions — docs.claude.com/en/docs/claude-code/github-actions
