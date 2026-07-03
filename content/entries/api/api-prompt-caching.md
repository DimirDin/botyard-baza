---
slug: api-prompt-caching
title: "Prompt Caching: снижение затрат до 90%"
summary: "Как размечать блоки контекста cache_control, чтобы не платить за повторное чтение больших кодовых баз."
section: api
tags: [api, prompt-caching, cost]
doc_url: "https://platform.claude.com/docs/en/about-claude/pricing"
sort_order: 10
published: true
---

### ❓ Что это
Prompt Caching — технология Anthropic API, позволяющая временно кэшировать тяжёлые неизменяемые блоки контекста. Повторные запросы читают их из кэша вместо полного повторного парсинга.

### 🎯 Зачем тебе
Если бот через API анализирует большой репозиторий, без кэширования каждый запрос стоит полной цены за весь контекст. С кэшем полная цена платится один раз, все последующие итерации — на порядок дешевле.

### 💻 Минимальный пример
```python
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": "Вся документация проекта...",
        "cache_control": {"type": "ephemeral"}
    }],
    messages=[{"role": "user", "content": "Найди баг в схеме БД"}]
)
```

### ⚠️ Грабли
Кэш живёт 5 минут с момента последнего запроса (есть опция часового кэша по повышенной цене записи). Минимальный объём для кэширования — около 1–2k токенов у Sonnet/Opus и больше у Haiku; точный порог сверяй в актуальной документации перед реализацией.

### 🔗 Первоисточник
platform.claude.com — Prompt Caching
