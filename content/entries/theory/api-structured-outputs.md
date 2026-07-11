---
slug: api-structured-outputs
title: "Structured Outputs: гарантированный JSON по схеме"
summary: "Constrained decoding, который не даёт модели сломать JSON. Плюс strict-режим для tool use."
section: theory
group: models
tags: [api, json, structured-outputs]
doc_url: "https://docs.claude.com/en/build-with-claude/structured-outputs"
sort_order: 102
published: true
---

![Structured outputs](/entry-images/api-request-response.jpg)

### ❓ Что это

Structured Outputs — constrained decoding: передаёшь JSON Schema, и модель физически не может
сгенерировать токен, нарушающий эту схему. В отличие от «попроси модель вернуть JSON в промпте»,
где возможны лишние поля, забытая скобка или обёртка в markdown-блок, здесь на каждом шаге
генерации из словаря исключаются токены, ведущие к невалидному по грамматике JSON. Вывод
гарантированно парсится `json.loads()` без обработки синтаксической ошибки.

### 🎯 Зачем тебе

Интеграции, где ответ модели напрямую попадает в код без ручной проверки: извлечение сущностей в
поля БД, генерация конфигов, готовый объект для рендера фронтенду. До structured outputs это
закрывалось хрупким «попроси JSON + регексни + retry на ошибку парсинга» с реальным процентом
отказов на нестандартных ответах.

### 💻 Минимальный пример

```json
{
  "model": "claude-sonnet-5",
  "max_tokens": 1024,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "extract_invoice",
      "schema": {
        "type": "object",
        "properties": {
          "vendor": { "type": "string" },
          "total": { "type": "number" },
          "currency": { "type": "string", "enum": ["USD", "EUR", "RUB"] }
        },
        "required": ["vendor", "total", "currency"],
        "additionalProperties": false
      }
    }
  },
  "messages": [{ "role": "user", "content": "Разбери счёт: ..." }]
}
```

Та же машинерия работает в **strict tool use** (`strict: true` на определении тула) — там она
гарантирует валидные аргументы вызова, а не свободный текст.

### ⚠️ Грабли

- **`additionalProperties: false` обязателен** для жёсткой схемы без произвольных полей.
- **Гарантия только синтаксическая, не смысловая** — поле `total` может быть корректным числом, но
  неправильным по факту, если модель не поняла документ.
- **Не все конструкции JSON Schema поддерживаются одинаково** — очень глубокая вложенность может
  работать не полностью, сверяйся с текущим списком.
- **Latency чуть выше** обычной генерации — constrained decoding не бесплатен.

### 🔗 Первоисточник
Structured Outputs — docs.claude.com/en/build-with-claude/structured-outputs
