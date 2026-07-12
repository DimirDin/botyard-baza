---
slug: api-tool-use-json
title: "Tool Use: вызов инструментов из API"
summary: "Проектирование JSON-схем и обработка структурированных ответов модели для интеграции с внешними системами."
section: theory
group: models
tags: [api, tool-use, function-calling]
doc_url: "https://platform.claude.com"
sort_order: 20
published: true
---

![Tool use](/entry-images/api-request-response.jpg)

### ❓ Что это

Базовый механизм tool use — ты описываешь инструменты JSON Schema'ми (`name`, `description`,
`input_schema`), модель решает, нужно ли вызвать инструмент, и возвращает блок `tool_use` с именем и
аргументами. Ты исполняешь вызов на своей стороне и возвращаешь результат как `tool_result` в
следующем сообщении.

### 🎯 Зачем тебе

Фундамент почти любой интеграции с внешним миром: курс валют из твоего API, запись в БД, письмо,
вызов внутреннего сервиса. Без tool use модель только рассуждает текстом.

Это базовый примитив, на котором построены практически все более специализированные механизмы этого
раздела — parallel tool use про несколько вызовов сразу, programmatic tool calling про оркестрацию
вызовов кодом, strict tool use про гарантию валидности аргументов, tool search про масштабирование на
сотни тулов. Понимание простого цикла `tool_use → исполнение на твоей стороне → tool_result` — база,
без которой сложнее осмыслить, какую конкретно проблему решает каждая из более продвинутых надстроек
поверх него.

### 💻 Минимальный пример

```json
{
  "tools": [{
    "name": "get_order_status",
    "description": "Возвращает статус заказа по номеру",
    "input_schema": { "type": "object", "properties": { "order_id": { "type": "string" } }, "required": ["order_id"] }
  }],
  "messages": [{ "role": "user", "content": "Где мой заказ #4521?" }]
}
```

Ответ: `{"type": "tool_use", "id": "toolu_1", "name": "get_order_status", "input": {"order_id": "4521"}}`.

### ⚠️ Грабли

- **`description` критичен для точности выбора** — конкретное описание лучше расплывчатого (см.
  Writing tools for agents).
- **Модель может вызвать неверный тул**, если описания похожи по смыслу.
- **`tool_result` обязателен для каждого `tool_use`** прежде чем диалог продолжится — пропуск ломает
  цепочку.

### 🔗 Первоисточник
Tool use — platform.claude.com
