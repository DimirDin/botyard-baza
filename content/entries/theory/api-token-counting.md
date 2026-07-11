---
slug: api-token-counting
title: "Token counting: считай токены до отправки"
summary: "Отдельный эндпоинт, который возвращает число входных токенов запроса без биллинга."
section: theory
group: models
tags: [api, tokens, cost]
doc_url: "https://docs.claude.com/en/build-with-claude/token-counting"
sort_order: 106
published: true
---

![Token counting](/entry-images/api-request-response.svg)

### ❓ Что это

Эндпоинт `/v1/messages/count_tokens` возвращает точное число входных токенов запроса без фактической
генерации ответа и без биллинга за неё. Точный подсчёт токенизатором Claude, включая нюансы вроде
того, что описания инструментов тоже занимают токены.

### 🎯 Зачем тебе

Проверка перед отправкой большого запроса, что он не превысит лимит окна — особенно важно, когда
контент динамический (файл переменного размера). Полезно для UI, показывающего оценку стоимости до
отправки.

### 💻 Минимальный пример

```bash
curl https://api.anthropic.com/v1/messages/count_tokens \
  -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
  -d '{"model": "claude-sonnet-5", "messages": [{"role": "user", "content": "..."}]}'
# -> {"input_tokens": 42}
```

### ⚠️ Грабли

- **Считает только input, не output** — число токенов ответа всё ещё неизвестно заранее.
- **Не учитывает эффект prompt caching** — возвращает полное число, независимо от возможного кэша.
- **Отдельный HTTP round-trip** — не бесплатная клиентская метадата.

### 🔗 Первоисточник
Token counting — docs.claude.com/en/build-with-claude/token-counting
