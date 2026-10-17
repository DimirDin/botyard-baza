---
slug: api-adaptive-thinking
title: "Adaptive thinking и параметр effort"
summary: "Модель сама решает, когда и сколько думать. Глубину задаёт output_config.effort, а не budget_tokens. Дефолты у Opus 5.5 и Sonnet 5.5 разные."
section: theory
group: reasoning
tags: [api, thinking, effort]
doc_url: "https://platform.claude.com/docs/en/build-with-claude/effort"
sort_order: 101
published: true
---

![Adaptive thinking](/entry-images/thinking-process.jpg)

### ❓ Что это

Adaptive thinking — режим, в котором модель сама решает, думать ли над запросом и насколько глубоко.
На всех текущих моделях (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1) он **включён по умолчанию**
и другого режима рассуждения у них нет: старый `budget_tokens` возвращает 400.

Рычаг управления — **`effort`**, отдельное поле `output_config.effort`. Пять уровней: `low`,
`medium`, `high`, `xhigh`, `max`. Effort влияет на **все** токены ответа: рассуждение, текст
и вызовы тулов. На низком effort модель реже думает, делает меньше вызовов тулов и пишет короче.

`effort` — поведенческий сигнал, а не жёсткий лимит. На `low` трудную задачу модель всё равно
обдумает, просто меньше, чем на `high`.

### 🎯 Зачем тебе

Effort — главный регулятор цены и задержки на моделях 5.x. Один и тот же Sonnet 5.5 на `low`
годится для чата, а на `high` — для сложного рефакторинга. Подбирать модель под каждый эндпоинт
часто не нужно: хватает правильного уровня effort.

Главная ловушка миграции — **разные дефолты**:

| Модель | Effort по умолчанию |
|---|---|
| Opus 5.5, Haiku 5.5 | `medium` |
| Sonnet 5.5, Fable 5.1, Opus 5, Sonnet 5 | `high` |

Переехал с Opus 5 на Opus 5.5 и не передаёшь effort — запросы молча работают на уровень ниже,
чем раньше. Иногда это выгодно, иногда роняет качество на сложных задачах.

### 💻 Минимальный пример

```json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 16000,
  "output_config": { "effort": "medium" },
  "messages": [{ "role": "user", "content": "..." }]
}
```

Поле `thinking` можно не передавать вовсе — adaptive уже включён.

#### С чего начинать (рекомендации документации)

| Модель | Старт | Когда выше |
|---|---|---|
| Sonnet 5.5 | `high`; для агентов и чата — `medium`/`low` | `xhigh`/`max` — только если эвалы показывают прирост |
| Opus 5.5 | `medium` (дефолт) | прогони свой sweep, не переноси настройки с Opus 5 |
| Haiku 5.5 | `medium`; `low` для чата и массовых простых задач | `high` — для knowledge work и длинных агентов |
| Fable 5.1 | `high` | `xhigh`/`max` для самых сложных агентных задач |

#### Сменить effort посреди диалога, не сбросив кэш

На Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1 и Opus 5 (бета `mid-conversation-output-config-2026-07-01`)
вставь в `messages` пустое system-сообщение с новым уровнем:

```json
{ "role": "system", "content": [], "output_config": { "effort": "low" } }
```

Префикс до него не меняется, поэтому prompt cache сохраняется. Смена top-level `effort` между
запросами, наоборот, кэш сбрасывает.

### ⚠️ Грабли

- **`adaptive` — это режим thinking, а не значение effort.** `"effort": "adaptive"` — ошибка.
- **Effort не переносится между поколениями.** У Sonnet 5.5 шкала перекалибрована: `high`
  на Sonnet 5.5 думает не столько же, сколько `high` на Sonnet 5. После переезда — заново sweep
  на своих эвалах.
- **На `xhigh`/`max` ставь большой `max_tokens`** (от 64k): thinking входит в лимит вывода,
  и с маленьким `max_tokens` ответ обрежется посреди работы.
- **Не путай с service tiers.** Effort управляет глубиной работы, service tier — приоритетом
  в очереди API.
- **`xhigh` есть не у всех моделей**, поддерживающих `max` (например, у Opus 4.6 и Sonnet 4.6 его нет).

### 🔗 Первоисточник
Effort — platform.claude.com/docs/en/build-with-claude/effort
