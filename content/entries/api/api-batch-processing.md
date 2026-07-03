---
slug: api-batch-processing
title: "Batch API: массовая обработка со скидкой 50%"
summary: "Отправка несрочных тяжёлых задач с отложенным ответом в течение суток и снижением стоимости токенов вдвое."
section: api
tags: [api, batch, cost]
doc_url: "https://platform.claude.com/docs/en/about-claude/pricing"
sort_order: 30
published: true
---

### ❓ Что это
Batch API — асинхронный режим для отправки массивов независимых запросов одним JSONL-файлом. Обработка идёт в фоне, результат — в течение 24 часов, стоимость входящих и исходящих токенов — вдвое ниже стандартной.

### 🎯 Зачем тебе
Подходит для фоновых задач без требования мгновенного ответа: массовый рефакторинг, парсинг логов, перевод контента на несколько языков перед релизом.

### 💻 Минимальный пример
```jsonl
{"custom_id": "req-001", "params": {"model": "claude-sonnet-5", "max_tokens": 500, "messages": [{"role": "user", "content": "..."}]}}
{"custom_id": "req-002", "params": {"model": "claude-sonnet-5", "max_tokens": 500, "messages": [{"role": "user", "content": "..."}]}}
```
```python
batch = client.beta.messages.batches.create(requests=[...])
print(batch.id, batch.processing_status)
```

### ⚠️ Грабли
Отменить батч в процессе обработки нельзя, деньги за уже обработанные токены не возвращаются. Для real-time фич в ботах Batch API не подходит — только для фоновых пайплайнов.

### 🔗 Первоисточник
platform.claude.com — Message Batches
