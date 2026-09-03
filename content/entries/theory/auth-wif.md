---
slug: auth-wif
title: "Workload Identity Federation: CI без долгоживущего ключа"
summary: "Четыре переменные, обмен JWT на токен и три вещи, которые молча перебивают federation."
section: theory
group: auth
tags: [auth, ci, security]
doc_url: "https://platform.claude.com/docs/en/api/overview"
sort_order: 322
published: true
---

### ❓ Что это

**Workload Identity Federation (WIF)** — способ авторизовать нагрузку (обычно CI) без
долгоживущего API-ключа. Рабочая нагрузка предъявляет свой JWT, SDK меняет его на токен
через `/v1/oauth/token` и дальше сам обновляет по мере надобности.

Статус — GA, бета-заголовок не нужен. Клиент конструируется обычный, без аргументов:
`Anthropic()` / `new Anthropic()` / `anthropic.NewClient()`.

### 🎯 Зачем тебе

Секрет, который лежит в переменных CI годами, — это секрет, который однажды утечёт.
WIF убирает его из уравнения: нет ключа — нечему утекать.

### 💻 Минимальный пример

Автоопределение включается, только когда заданы **все четыре** переменные:

```bash
ANTHROPIC_FEDERATION_RULE_ID=...
ANTHROPIC_ORGANIZATION_ID=...
ANTHROPIC_SERVICE_ACCOUNT_ID=...
ANTHROPIC_IDENTITY_TOKEN_FILE=...     # или ANTHROPIC_IDENTITY_TOKEN
```

```python
from anthropic import Anthropic
client = Anthropic()      # WIF подхватится сам
```

`ANTHROPIC_WORKSPACE_ID` активацию **не** включает: он нужен только если правило федерации
охватывает несколько воркспейсов — иначе прилетит `400 workspace_id_required`.
Для правила на один воркспейс переменная не обязательна.

### ⚠️ Грабли

- **Три вещи перебивают WIF:** `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` (даже пустые!)
  и заданный `ANTHROPIC_PROFILE`. Чтобы federation заработала, сними все три.
- **Не все четыре переменные — не сработает ничего.** Автоопределение по принципу «всё или ничего»,
  частичный набор просто игнорируется, и ты получишь невнятную ошибку авторизации.
- **Заданный `ANTHROPIC_PROFILE` с отсутствующим профилем** — ошибка, а не откат к WIF.
- Управление правилами федерации и сервисными аккаунтами живёт в Admin API.

### 🔗 Первоисточник
Anthropic API overview — platform.claude.com/docs/en/api/overview
