---
slug: cheat-sdk-messages
title: "Сообщения и результаты Agent SDK"
category: api
sort_order: 75
---

Сверено с code.claude.com/docs/en/agent-sdk/agent-loop, 20.08.2026.

### Типы сообщений в потоке

| Тип | Когда приходит |
|---|---|
| `SystemMessage` | Жизненный цикл. Подтипы: `init`, `compact_boundary`, `informational`, `worker_shutting_down` |
| `AssistantMessage` | После каждого ответа модели, включая финальный |
| `UserMessage` | После выполнения инструмента — с результатом |
| `StreamEvent` | Только при включённых частичных сообщениях |
| `ResultMessage` | Конец цикла |

### Подтипы результата

| `subtype` | Что случилось | Есть `result`? |
|---|---|---|
| `success` | Задача завершена нормально | да |
| `error_max_turns` | Упёрлись в `maxTurns` | нет |
| `error_max_budget_usd` | Упёрлись в `maxBudgetUsd` | нет |
| `error_during_execution` | Ошибка прервала цикл | нет |
| `error_max_structured_output_retries` | Не получен валидный структурированный вывод | нет |

Все подтипы несут `total_cost_usd`, `usage`, `num_turns`, `session_id`.

### `stop_reason`

`end_turn` — закончил нормально · `max_tokens` — упёрся в лимит вывода ·
`refusal` — модель отказалась. После краха сессии — `null`.

### Грабли

- `result` есть **только** у `success` — проверяй `subtype` до чтения.
- Одиночный `query()` **бросает исключение** после ошибочного результата — оборачивай в `try`.
- Не обрывай итератор на `ResultMessage`: после него бывает хвост системных событий.
- В Python `total_cost_usd`, `usage`, `model_usage` опциональны — проверяй на `None`.
- `usage` — только основной цикл; всё дерево с сабагентами — `model_usage` / `modelUsage`.

### Проверка типа

```python
isinstance(message, ResultMessage)          # Python
```
```typescript
message.type === "result"                    // TypeScript
// content-блоки: message.message.content, не message.content
```
