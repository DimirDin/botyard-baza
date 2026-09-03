---
slug: api-refusal-fallbacks
title: "Отказ модели: stop_reason refusal и серверный fallback"
summary: "Приходит с HTTP 200. Код, который сразу читает content, получает пустоту и не понимает почему."
section: theory
group: api-io
tags: [api, production, errors]
doc_url: "https://platform.claude.com/docs/en/api/overview"
sort_order: 228
published: true
---

![Запрос и ответ](/entry-images/api-request-response.jpg)

### ❓ Что это

Классификаторы безопасности могут отклонить запрос. Ответ при этом приходит **с HTTP 200**,
а признак — в поле `stop_reason: "refusal"` и в `stop_details` с категорией и пояснением.

Это не ошибка транспорта. Это успешный ответ, в котором нет содержимого.

`stop_details` заполняется **только** при `stop_reason == "refusal"`. При любом другом
(`end_turn`, `max_tokens`, `tool_use`, `pause_turn`, …) там `null` — всегда проверяй перед чтением.

### 🎯 Зачем тебе

Типовой прод-баг на Opus 5 и Fable 5: код делает `resp.content[0].text` сразу после запроса.
При отказе `content` пустой — приложение падает по IndexError или молча отдаёт пустую строку
пользователю. Ретрай не помогает: запрос-то успешный.

### 💻 Минимальный пример

Проверка `stop_reason` **до** чтения контента:

```python
resp = client.messages.create(model="claude-opus-5", max_tokens=16000, messages=[...])

if resp.stop_reason == "refusal":
    category = resp.stop_details.category      # "cyber", "bio", ... или None
    handle_refusal(category)
else:
    text = resp.content[0].text
```

Серверный fallback снимает проблему автоматически — маршрутизирует по категории отказа,
и список моделей поддерживать не нужно:

```python
resp = client.beta.messages.create(
    model="claude-opus-5", max_tokens=16000,
    betas=["server-side-fallback-2026-07-01"],
    fallbacks="default",
    messages=[...],
)
```

### ⚠️ Грабли

- **Отказ бывает и посреди стрима**, не только в начале ответа.
- **Категории — открытый набор.** `"cyber"`, `"bio"`, `"reasoning_extraction"`, `"frontier_llm"`,
  `null` — и список может пополняться. Не пиши `match` без ветки по умолчанию.
- **На Bedrock, Vertex и Foundry серверного fallback нет** — там клиентский
  `BetaRefusalFallbackMiddleware` + `BetaFallbackState`. Серверный работает на первом API
  Anthropic и на Claude Platform on AWS.
- **Старая форма массивом** (`betas: ["server-side-fallback-2026-06-01"]` +
  `fallbacks: [{"model": "claude-opus-4-8"}]`) ещё работает, но требует ручного списка моделей.

### 🔗 Первоисточник
Anthropic API overview — platform.claude.com/docs/en/api/overview
