---
slug: api-streaming-responses
title: "Стриминг ответов (Server-Sent Events)"
summary: "Как правильно принимать поток токенов на бэкенде для мгновенного отображения текста пользователю."
section: api
tags: [api, streaming]
doc_url: "https://platform.claude.com"
sort_order: 40
published: true
---

### ❓ Что это
Стриминг — потоковая отдача сгенерированных токенов по протоколу SSE вместо ожидания полного ответа одним пакетом.

### 🎯 Зачем тебе
Критично для UX: пользователь видит начало «печати» текста уже через доли секунды, субъективное время ожидания падает почти до нуля.

### 💻 Минимальный пример
```python
with client.messages.stream(
    model="claude-sonnet-5", max_tokens=1024,
    messages=[{"role": "user", "content": "Напиши docker-compose для мониторинга"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### ⚠️ Грабли
Стриминг усложняет парсинг структурированных данных: JSON нельзя распарсить, пока поток не закрыт полностью. Для строгих схем ответа стриминг сильно усложняет архитектуру бэкенда.

### 🔗 Первоисточник
platform.claude.com — Streaming Messages
