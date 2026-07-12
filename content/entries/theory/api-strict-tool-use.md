---
slug: api-strict-tool-use
title: "Strict tool use: валидные аргументы инструментов гарантированно"
summary: "Флаг strict:true включает constrained decoding для схемы инструмента — без битых аргументов."
section: theory
group: models
tags: [api, tools, structured-outputs]
doc_url: "https://docs.claude.com/en/agents-and-tools/tool-use/strict-tool-use"
sort_order: 118
published: true
---

![Strict tool use](/entry-images/api-request-response.jpg)

### ❓ Что это

Strict tool use (`strict: true`) включает тот же constrained decoding, что и Structured Outputs, но
для аргументов вызова тула: модель физически не может сгенерировать аргумент, не соответствующий
JSON Schema — ни лишнего поля, ни неверного типа, ни пропущенного обязательного параметра.

### 🎯 Зачем тебе

Продакшен-интеграции, где вызов тула сразу бьёт в реальную систему без человека посередине —
платёжный API, изменение записи в БД. Цена невалидного аргумента здесь — не просто повторный запрос,
а испорченные данные или неудачный вызов внешнего API.

Без strict-режима типичная защита — валидация аргументов на своей стороне после получения `tool_use`
и retry-запрос модели с объяснением ошибки, если валидация не прошла. Это рабочий паттерн, но
добавляет round-trip и не даёт стопроцентной гарантии до момента фактической проверки. Strict tool
use переносит эту гарантию на уровень генерации — невалидный по схеме аргумент физически не может
появиться в ответе, что упрощает клиентский код и убирает целый класс ошибок валидации на корню.

### 💻 Минимальный пример

```json
{
  "name": "create_ticket",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "priority": { "type": "string", "enum": ["low", "medium", "high"] }
    },
    "required": ["title", "priority"],
    "additionalProperties": false
  }
}
```

С `strict: true` `priority` гарантированно одно из трёх значений, не `"важный"` или `"P1"`.

### ⚠️ Грабли

- **Требует полностью совместимой схемы** — сложные конструкции стоит упрощать.
- **Строгость про синтаксис, не здравый смысл** — модель может выбрать `low` там, где по смыслу
  нужен `high`, если сам запрос неоднозначен.
- **Небольшой прирост латентности** — constrained decoding не бесплатен.

### 🔗 Первоисточник
Strict tool use — docs.claude.com/en/agents-and-tools/tool-use/strict-tool-use
