---
slug: cheat-api-limits-models
title: "Модели, лимиты и коды ошибок API"
category: api
sort_order: 30
---

### Актуальная линейка (сверено с platform.claude.com, 03.07.2026)
| Модель | Контекст | Input / Output за 1M токенов |
|---|---|---|
| Claude Fable 5 | 1M | $10.00 / $50.00 |
| Claude Opus 4.8 | 1M | $5.00 / $25.00 |
| Claude Sonnet 5 | 1M | $3.00 / $15.00 (промо $2/$10 до 31.08.2026) |
| Claude Haiku 4.5 | 200k | $1.00 / $5.00 |

### Коды ошибок
| Код | Название | Что делать |
|---|---|---|
| 400 | Invalid Request | Не ретраить — чинить схему запроса |
| 401 | Authentication Error | Проверить API-ключ |
| 429 | Rate Limit Exceeded | Retry с экспоненциальным backoff |
| 529 | Overloaded | Повторить через 2–5 секунд |

### Prompt Caching
- TTL кэша: ~5 минут с момента последнего запроса (доступен вариант с часовым TTL по повышенной цене записи)
- Batch API: скидка 50% на вход и выход, ответ в течение 24 часов

Точные пороги минимального объёма для кэширования и актуальные тарифы Fast Mode меняются чаще прочего — перед публикацией в проде сверяй с platform.claude.com/docs/en/about-claude/pricing.
