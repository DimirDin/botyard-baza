---
slug: api-rate-limits-tiers
title: "Rate Limits и тиры аккаунта"
summary: "Как устроены лимиты RPM/TPM, ошибка 429 и повышение уровня аккаунта в Anthropic Console."
section: api
tags: [api, rate-limits]
doc_url: "https://platform.claude.com"
sort_order: 60
published: true
---

### ❓ Что это
Rate Limits — ограничения на количество запросов и токенов в минуту (RPM/TPM) и суточный лимит расходов. Аккаунты разбиты на уровни (Tiers), повышающиеся по мере пополнения баланса и успешных списаний.

### 🎯 Зачем тебе
Если бот внезапно получает всплеск трафика, можно упереться в потолок текущего тира и получить массовую ошибку 429. Понимание механики тиров позволяет заранее прогреть аккаунт перед релизом.

### 💻 Минимальный пример
Текущие лимиты видны прямо в заголовках ответа API:
```
anthropic-ratelimit-requests-limit: 4000
anthropic-ratelimit-requests-remaining: 3998
anthropic-ratelimit-tokens-limit: 400000
anthropic-ratelimit-tokens-remaining: 382400
```

### ⚠️ Грабли
TPM считает размер всего контекста запроса, а не только нового сообщения. При отправке тяжёлого контекста на низком тире можно упереться в лимит буквально за пару запросов в минуту.

### 🔗 Первоисточник
Anthropic Console — Rate Limits
