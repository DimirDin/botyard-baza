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

### ❓ Что это
Tool Use — способность модели распознавать, что для ответа нужны внешние данные или действия, и вместо текста возвращать структурированный JSON-объект с аргументами для вызова функции. Сам код модель не выполняет — это делает твой бэкенд.

### 🎯 Зачем тебе
Мост между абстрактной моделью и твоей инфраструктурой: селекты в Postgres, вызовы эндпоинтов, отправка уведомлений — всё через один и тот же механизм декларации инструментов.

### 💻 Минимальный пример
```python
tools = [{
    "name": "get_user_score",
    "description": "Возвращает баллы профиля пользователя",
    "input_schema": {
        "type": "object",
        "properties": {
            "user_id": {"type": "string"},
            "test_type": {"type": "string", "enum": ["big_five", "riasec"]}
        },
        "required": ["user_id", "test_type"]
    }
}]

response = client.messages.create(
    model="claude-sonnet-5", max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "Покажи riasec баллы юзера usr_99"}]
)
if response.stop_reason == "tool_use":
    call = [b for b in response.content if b.type == "tool_use"][0]
    print(call.name, call.input)
```

### ⚠️ Грабли
Модель может сгенерировать несуществующий ID или перепутать типы данных, если схема описана небрежно. Всегда валидируй полученный JSON (например, через Pydantic) перед выполнением в реальной БД.

### 🔗 Первоисточник
platform.claude.com — Tool Use
