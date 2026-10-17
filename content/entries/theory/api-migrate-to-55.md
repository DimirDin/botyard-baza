---
slug: api-migrate-to-55
title: "Переезд на модели 5.5: что сломается в коде"
summary: "Opus 5.5 дешевле Opus 5, но отклоняет forced tool use, отключение thinking, temperature и prefill. Список 400-ок и чек-лист миграции."
section: theory
group: models
tags: [api, models, migration, opus, sonnet, haiku]
doc_url: "https://platform.claude.com/docs/en/models/opus-5-5/migration-guide"
sort_order: 45
published: true
---

![Миграция](/entry-images/pricing-tiers.jpg)

### ❓ Что это

В сентябре–октябре 2026 вышла линейка 5.5: **Opus 5.5** (22.09), **Sonnet 5.5** (28.09) и
**Haiku 5.5** (07.10). У всех трёх — окно 1M токенов, до 128k вывода и знания по июнь 2026.

| Модель | id | Цена за 1M (in/out) | Effort по умолчанию |
|---|---|---|---|
| Opus 5.5 | `claude-opus-5-5` | $4 / $20 | `medium` |
| Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10 | `high` |
| Haiku 5.5 | `claude-haiku-5-5` | $0.10 / $0.50 (до 100k промпта) | `medium` |

Opus 5.5 **дешевле** Opus 5 ($5/$25), а Sonnet 5.5 стоит столько же, сколько Sonnet 5. Экономически переезд выгоден почти всегда. Вопрос только в том, что сломается.

### 🎯 Зачем тебе

Замена строки `model` — не вся миграция. На Opus 5.5 часть привычных параметров возвращает **400**,
и упадёт ровно тот код, который годами работал на прошлых моделях.

### 💻 Что возвращает 400 на Opus 5.5

| Было в коде | Что будет | Чем заменить |
|---|---|---|
| `tool_choice: {"type": "tool"}` или `"any"` | 400, в том числе на `count_tokens` | `auto` + strict tool use или structured outputs |
| `thinking: {"type": "disabled"}` | 400 — отключить рассуждение нельзя | понижать `output_config.effort` |
| `thinking: {"type": "enabled", "budget_tokens": N}` | 400 | убрать поле, глубину задавать effort |
| `temperature` / `top_p` / `top_k` не по умолчанию | 400 | управлять поведением промптом |
| Prefill: `messages` кончается репликой assistant | 400 | structured outputs или system-инструкция |
| Тул `computer_20251124` (Claude API, Google Cloud) | 400 | `computer_toolset_20260801` |

#### Автоматическая миграция

В Claude Code есть встроенный скилл, который проходит по кодовой базе, меняет id, чинит
несовместимые параметры и выдаёт чек-лист ручной проверки:

```text
/claude-api migrate this project to claude-opus-5-5
```

Перед правками он спросит, какую область мигрировать: весь каталог, подпапку или список файлов.

### ⚠️ Грабли

- **Effort по умолчанию у Opus 5.5 — `medium`, у Opus 5 был `high`.** Если не передаёшь effort,
  после переезда запросы молча работают на уровень ниже. Прогони свой sweep effort заново.
- **Thinking-блоки привязаны к модели.** Блоки Opus 5.5 читают только Fable 5.1 и Mythos 5.1.
  Роутер или fallback, который переключает диалог с Opus 5.5 на другую модель, продолжит его без
  прошлых рассуждений.
- **Текст между вызовами тулов приходит внутри thinking-блоков.** Код, который собирает ответ
  только из `text`-блоков, может «потерять» часть пояснений.
- **Больше категорий отказов.** Opus 5.5 может вернуть `stop_reason: "refusal"` с
  `stop_details.category`, включая новые значения вроде `"bio"`. Проверяй `stop_reason` до чтения
  `content` и держи fallback.
- **Haiku 5.5 дорожает в 5 раз после 100k входных токенов** — весь запрос, а не только хвост.
  Длинные документы режь на куски до 100k.
- **Sonnet 5.5 не принимает `thinking: {"type": "disabled"}`.** Минимальный режим у него —
  `{"type": "between_tools"}`, и только при effort не выше `high`.

### 🔗 Первоисточник
Claude Opus 5.5 migration guide — platform.claude.com/docs/en/models/opus-5-5/migration-guide
