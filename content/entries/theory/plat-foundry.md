---
slug: plat-foundry
title: "Claude in Microsoft Foundry: Azure-счёт по ставкам Anthropic"
summary: "Anthropic-операруемая площадка со счётом через Azure Marketplace в CCU, стандартные тарифы и ограниченная поддержка SDK."
section: theory
group: platforms
tags: [platforms, azure, foundry]
doc_url: "https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry"
sort_order: 314
published: true
---

### ❓ Что это

**Claude in Microsoft Foundry** — доступ к Claude внутри Azure. Счёт идёт через Azure Marketplace
в тех же **CCU**, что и на Claude Platform on AWS: $0.01 за CCU, почасовая метрика, постоплата.

Важная деталь по цене: тарифы здесь — **стандартные ставки первого API Anthropic**.
Foundry в этом смысле ближе к Claude Platform on AWS, чем к Bedrock и Vertex,
у которых собственное партнёрское ценообразование.

### 🎯 Зачем тебе

Компания сидит на Azure, есть коммит перед Microsoft, а платить хочется через привычный
маркетплейс — при этом не переплачивая партнёрскую наценку.

### 💻 Минимальный пример

```python
from anthropic import AnthropicFoundry

client = AnthropicFoundry(api_key="...", resource="my-foundry-resource")
resp = client.messages.create(model="claude-opus-5", max_tokens=16000, messages=[...])
```

Поддержка по языкам неполная:

| Язык | Foundry |
|---|---|
| Python, TypeScript, Java, C#, PHP | есть |
| **Go, Ruby** | **нет** |

Для Ruby остаётся обычный `Anthropic::Client.new(base_url: "<foundry endpoint>")`,
но авторизация Entra ID туда не встроена — её придётся делать руками.

### ⚠️ Грабли

- **Резидентность через тип развёртывания.** US Data Zone Standard — эквивалент
  `inference_geo: "us"` с тем же множителем 1.1×.
- **Managed Agents на Foundry недоступны** — как и на других не-первых площадках,
  кроме Claude Platform on AWS.
- **CCU-строка в счёте одна.** Разбивку смотри в Azure Cost Management, но она агрегированная;
  детализация по моделям — на стороне Anthropic.
- **Не путай с Azure OpenAI.** Это другой сервис другого вендора, общего только облако.

### 🔗 Первоисточник
Claude in Microsoft Foundry — platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry
