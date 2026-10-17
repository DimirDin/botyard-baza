---
slug: api-extended-thinking
title: "Thinking в API: почему старый budget_tokens отдаёт 400"
summary: "Как устроено рассуждение модели в API сейчас: adaptive по умолчанию, display: omitted, и почему пример с type: enabled ломается на всех моделях новее 4.6."
section: theory
group: reasoning
tags: [api, thinking, reasoning]
doc_url: "https://platform.claude.com/docs/en/build-with-claude/thinking"
sort_order: 100
published: true
---

![Thinking](/entry-images/thinking-process.jpg)

### ❓ Что это

Thinking — режим, в котором модель перед ответом прорабатывает задачу: переформулирует вопрос,
пробует подходы, проверяет промежуточные результаты. В ответе это приходит отдельными блоками
`{"type": "thinking", ...}` перед текстом. Токены рассуждения оплачиваются **как output** и входят
в `max_tokens` — даже когда текст рассуждения тебе не возвращается.

Важное изменение последних поколений: ручной режим «extended thinking»
(`thinking: {type: "enabled", budget_tokens: N}`) **больше не принимается** ни одной текущей моделью.
На Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1, Opus 5, Sonnet 5 и Opus 4.7/4.8 такой запрос
возвращает **400**. Он работает только на Opus 4.6 и Sonnet 4.6 (помечен deprecated) и на старых
Opus 4.5 / Sonnet 4.5 / Haiku 4.5.

```mermaid
sequenceDiagram
  autonumber
  actor Client as Приложение
  participant API as Claude API
  participant Model as Модель 5.x

  Client->>API: POST /v1/messages (без поля thinking)
  API->>Model: Задача + effort
  Note over Model: Adaptive: сама решает,<br/>думать ли и сколько
  Model-->>API: thinking (signature, текст пустой)
  Model-->>API: text
  API-->>Client: [thinking, text]

  click Model href "entry:api-adaptive-thinking" "Adaptive thinking и effort"
```

#### Что ты видишь в ответе

- На текущих моделях thinking **включён по умолчанию** — настраивать ничего не нужно.
- `display` по умолчанию `"omitted"`: блок приходит с **пустым** полем `thinking` и заполненным
  `signature`. Хочешь читать рассуждение — передай `display: "summarized"`.
- Даже `summarized` — это **сводка** рассуждения, а не сырой chain of thought. Сырого текста
  API не отдаёт никогда.

### 🎯 Зачем тебе

Если у тебя в коде остался рецепт из гайдов двухлетней давности — `type: "enabled"` и подобранный
`budget_tokens`, — то при смене модели на актуальную запрос просто упадёт. Глубина рассуждения
теперь регулируется **`effort`**, а не бюджетом токенов (подробно — в статье про adaptive thinking).

Обратная ловушка: «я не включал thinking, значит не плачу за него». На моделях 5.x он включён сам,
и его токены уже в счёте. Не видишь их в ответе — потому что `display: "omitted"`, а не потому что
их нет.

### 💻 Минимальный пример

Рассуждение включено и показано сводкой:

```json
{
  "model": "claude-opus-5-5",
  "max_tokens": 16000,
  "thinking": { "type": "adaptive", "display": "summarized" },
  "messages": [{ "role": "user", "content": "Найди НОД 1071 и 462" }]
}
```

Ответ:

```json
[
  { "type": "thinking", "thinking": "Алгоритм Евклида: 1071 = 2·462 + 147…", "signature": "…" },
  { "type": "text", "text": "НОД = 21" }
]
```

#### Как выключить или ослабить рассуждение

| Модель | `thinking: {type: "disabled"}` | Что делать вместо |
|---|---|---|
| Opus 5.5, Fable 5.1, Fable 5 | 400 всегда | понижать `effort` |
| Sonnet 5.5 | 400 | `{"type": "between_tools"}` при effort ≤ `high` |
| Haiku 5.5, Opus 5 | работает при effort ≤ `high` | на `xhigh`/`max` — только adaptive |
| Sonnet 5 | работает | — |

### ⚠️ Грабли

- **`type: "enabled"` + `budget_tokens` = 400** на всех моделях новее 4.6. Миграция — удалить поле
  `thinking` целиком (или поставить `adaptive`) и выставить `output_config.effort`.
- **Thinking съедает `max_tokens`.** На высоком effort ставь большой `max_tokens` (для агентного
  кодинга на Sonnet 5.5 документация советует 128 000 и стриминг), иначе ответ оборвётся
  на `stop_reason: "max_tokens"` посреди рассуждения.
- **Блоки thinking возвращай в историю как есть**, вместе с `signature`. Сервер восстанавливает
  по подписи полное рассуждение; правка или удаление блока ломает многошаговый tool use.
- **`display: "omitted"` ускоряет первый токен текста** при стриминге — сервер не шлёт рассуждение.
  Если не показываешь thinking пользователю, оставляй дефолт.
- **Не строй бизнес-логику на тексте thinking** — это сводка черновика, финальный ответ может
  с ней расходиться.

### 🔗 Первоисточник
Thinking — platform.claude.com/docs/en/build-with-claude/thinking
