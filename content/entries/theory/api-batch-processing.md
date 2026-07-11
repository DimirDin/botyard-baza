---
slug: api-batch-processing
title: "Batch API: массовая обработка со скидкой 50%"
summary: "Отправка несрочных тяжёлых задач с отложенным ответом в течение суток и снижением стоимости токенов вдвое."
section: theory
group: pricing
tags: [api, batch, cost]
doc_url: "https://platform.claude.com/docs/en/about-claude/pricing"
sort_order: 30
published: true
---

![Batch API](/entry-images/pricing-tiers.svg)

### ❓ Что это

Batch API — отдельный эндпоинт для отправки большого количества независимых запросов пакетом, с
обработкой в течение суток и скидкой около 50%. Формируешь JSONL с массивом запросов, отправляешь
как одну batch-задачу, получаешь `batch_id`, поллишь статус, забираешь результаты по каждому запросу
с сохранением `custom_id`.

### 🎯 Зачем тебе

Ночная разметка тысяч записей, генерация описаний для каталога, пакетный анализ логов за день.
Экономия в 2 раза при больших объёмах ощутима на счету, если продукт может подождать часы вместо
секунд.

### 💻 Минимальный пример

```jsonl
{"custom_id": "req-1", "params": {"model": "claude-sonnet-5", "max_tokens": 200, "messages": [...]}}
{"custom_id": "req-2", "params": {"model": "claude-sonnet-5", "max_tokens": 200, "messages": [...]}}
```

```bash
curl https://api.anthropic.com/v1/messages/batches -d @requests.jsonl ...
# -> {"id": "batch_abc", "processing_status": "in_progress"}
```

### ⚠️ Грабли

- **Не для интерактивного трафика** — окно до суток не подходит, если пользователь ждёт на экране.
- **`custom_id` обязателен и уникален** — единственный способ сопоставить результат с запросом.
- **Частичные failures внутри батча — норма** — обрабатывай построчно, каждая запись независима.

### 🔗 Первоисточник
Batch processing — platform.claude.com/docs/en/about-claude/pricing
