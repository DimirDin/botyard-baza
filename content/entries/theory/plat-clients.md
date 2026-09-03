---
slug: plat-clients
title: "Клиенты SDK под площадки: Mantle, Vertex, Foundry"
summary: "У каждой площадки свой класс клиента и свой формат id модели. Подмена base_url у обычного клиента не работает."
section: theory
group: platforms
tags: [platforms, sdk, bedrock, vertex]
doc_url: "https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai"
sort_order: 312
published: true
---

### ❓ Что это

Для каждой площадки в SDK есть **отдельный класс клиента**. После конструктора поверхность
одинаковая — тот же `messages.create` / `.stream`, — но авторизация и формат id модели различаются.

| Площадка | Python-клиент | id модели |
|---|---|---|
| Bedrock | `AnthropicBedrockMantle(aws_region=...)` | префикс `anthropic.` → `anthropic.claude-opus-5` |
| Vertex AI | `AnthropicVertex(project_id=..., region=...)` | **без префикса** → `claude-opus-5` |
| Foundry | `AnthropicFoundry(api_key=..., resource=...)` | как в первом API |

### 🎯 Зачем тебе

Чтобы не потратить полдня на 401 и «model not found». Обе ошибки почти всегда означают
не то, что кажется: не тот класс клиента или не тот формат id.

### 💻 Минимальный пример

```python
# Bedrock — предпочитай Mantle-клиент (Messages-API эндпоинт)
from anthropic import AnthropicBedrockMantle
client = AnthropicBedrockMantle(aws_region="us-east-1")
client.messages.create(model="anthropic.claude-opus-5", ...)

# Vertex — авторизация через GCP ADC, ключа Anthropic нет вообще
from anthropic import AnthropicVertex          # ставится как anthropic[vertex]
client = AnthropicVertex(project_id="my-proj", region="global")
client.messages.create(model="claude-opus-5", ...)
```

На Vertex датированные снапшоты пишутся через `@`: `claude-opus-4-5@20251101` —
**не** `claude-opus-4-5-20251101`.

### ⚠️ Грабли

- **`AnthropicBedrock` без `Mantle`** — легаси-путь через `bedrock-runtime` InvokeModel.
  Для нового кода бери Mantle-клиент.
- **Go и Ruby не поддерживают Foundry.** Для Ruby остаётся `Anthropic::Client.new(base_url: ...)`
  как запасной вариант, но авторизации Entra ID там нет из коробки.
- **Не приписывай датные суффиксы к обычным id.** `claude-opus-5` — полный идентификатор,
  `claude-opus-5-20260101` не существует.
- **`region="global"` на Vertex** — рекомендуемое значение; есть ещё мульти-регионы `us`/`eu`
  и конкретные регионы, но они дороже на 10%.

### 🔗 Первоисточник
Claude on Vertex AI — platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai
