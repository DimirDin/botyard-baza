---
slug: api-error-handling
title: "Обработка ошибок API и стратегия Retry"
summary: "Коды ошибок 400/401/429/529 и реализация экспоненциального backoff для стабильных интеграций."
section: api
tags: [api, errors, reliability]
doc_url: "https://platform.claude.com"
sort_order: 70
published: true
---

### ❓ Что это
Слой обработки ошибок API отвечает за перехват и корректную отработку сбойных статус-кодов, включая retry-стратегию с экспоненциальной задержкой для временных сетевых сбоев и перегрузок (5xx).

### 🎯 Зачем тебе
Без грамотного хендлинга временная ошибка 429 роняет всю сессию пользователя. С правильным retry бот «перетерпит» затык шлюза и ответит без видимого сбоя.

### 💻 Минимальный пример
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import anthropic

@retry(stop=stop_after_attempt(5),
       wait=wait_exponential(multiplier=2, min=2, max=16),
       retry=retry_if_exception_type((anthropic.RateLimitError, anthropic.APIStatusError)),
       reraise=True)
def call_claude(prompt):
    return client.messages.create(model="claude-sonnet-5", max_tokens=300,
                                   messages=[{"role": "user", "content": prompt}])
```

### ⚠️ Грабли
Не путай типы ошибок: retry имеет смысл для 429/5xx, но не для 400 (невалидный запрос) — там нужна правка кода, а не повторная отправка того же самого.

### 🔗 Первоисточник
platform.claude.com — Errors and Rate Limits
