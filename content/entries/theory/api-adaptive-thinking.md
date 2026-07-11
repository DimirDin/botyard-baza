---
slug: api-adaptive-thinking
title: "Adaptive thinking и параметр effort"
summary: "Модель сама решает, когда и сколько думать. Глубину задаёт effort, а не budget_tokens."
section: theory
group: models
tags: [api, thinking, effort]
doc_url: "https://docs.claude.com/en/build-with-claude/adaptive-thinking"
sort_order: 101
published: true
---

![Adaptive thinking](/entry-images/thinking-process.jpg)

### ❓ Что это

Adaptive thinking — развитие extended thinking: вместо жёсткого `budget_tokens` задаётся параметр
`effort` (`low`/`medium`/`high`), и модель сама решает, сколько токенов реально нужно на рассуждение
под конкретный запрос, вместо того чтобы упираться в заранее угаданный лимит.

`budget_tokens` — потолок, который угадывается один раз для всего трафика. `effort` — уровень усилия,
интерпретируемый моделью адаптивно под каждый запрос. Лёгкий вопрос на `effort: high` не будет
искусственно раздут до потолка.

### 🎯 Зачем тебе

При неоднородном трафике (часть запросов тривиальные, часть требуют многошагового разбора)
фиксированный `budget_tokens` заставляет выбирать между «мало для сложных» и «дорого для простых».
`effort` снимает эту дилемму: один уровень покрывает весь спектр, а биллинг подстраивается под
фактическую потребность.

### 💻 Минимальный пример

```json
{
  "model": "claude-sonnet-5",
  "max_tokens": 4096,
  "thinking": { "type": "enabled", "effort": "high" },
  "messages": [{ "role": "user", "content": "..." }]
}
```

Практика: `effort: medium` как дефолт для основного трафика, `effort: high` — точечно, для
эндпоинтов с явным агентным планированием или сложной бизнес-логикой.

### ⚠️ Грабли

- **effort не прямой аналог budget_tokens** — миграция «поставим high и не думать» может быть хуже
  по счёту, чем подбор конкретного бюджета под свой профиль трафика.
- **Латентность всё ещё растёт** с уровнем effort — не бесплатный переключатель, а компромисс между
  скоростью и глубиной, просто откалиброванный автоматически.
- **Не путай с service tiers** — effort управляет глубиной мышления, service tier — приоритетом
  обработки запроса в очереди API.

### 🔗 Первоисточник
Adaptive thinking — docs.claude.com/en/build-with-claude/adaptive-thinking
