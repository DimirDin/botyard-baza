---
slug: api-streaming-responses
title: "Стриминг ответов (Server-Sent Events)"
summary: "Как правильно принимать поток токенов на бэкенде для мгновенного отображения текста пользователю."
section: theory
group: models
tags: [api, streaming]
doc_url: "https://platform.claude.com"
sort_order: 40
published: true
---

![Streaming responses](/entry-images/api-request-response.jpg)

### ❓ Что это

Стриминг через Server-Sent Events (`"stream": true`) — модель отдаёт токены по мере генерации.
Поток состоит из типизированных событий: `message_start`, `content_block_start`,
`content_block_delta`, `content_block_stop`, `message_delta`, `message_stop` — клиент обрабатывает
каждый тип, а не просто читает сырой текст.

### 🎯 Зачем тебе

Любой чат-интерфейс — без стриминга пользователь видит спиннер на несколько секунд и весь ответ
разом; со стримингом текст появляется по мере генерации. Также полезно для очень длинных ответов,
где таймаут прокси иначе может оборвать соединение.

### 💻 Минимальный пример

```python
with client.messages.stream(model="claude-sonnet-5", max_tokens=1024, messages=[...]) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### ⚠️ Грабли

- **Прокси/CDN может буферизовать SSE** без явной настройки — локально работает, в проде за
  nginx/CDN ответ приходит одним куском.
- **Обработка ошибок посреди потока сложнее** — соединение может оборваться после части токенов.
- **Стриминг tool use требует накопления по блокам** (см. Fine-grained streaming), нельзя печатать
  каждый дельта-кусок JSON как есть.

### 🔗 Первоисточник
Streaming — platform.claude.com
