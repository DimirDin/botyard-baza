---
slug: plat-overview
title: "Где ещё живёт Claude: четыре площадки и их различия"
summary: "Первый API Anthropic, Claude Platform on AWS, Bedrock, Vertex и Foundry — кто оперирует, кто выставляет счёт, что теряется по дороге."
section: theory
group: platforms
tags: [platforms, bedrock, vertex, foundry]
doc_url: "https://platform.claude.com/docs/en/about-claude/pricing"
sort_order: 310
published: true
---

![Площадки](/entry-images/api-request-response.jpg)

### ❓ Что это

Claude доступен не только через первый API Anthropic. Площадок пять, и они делятся по двум
признакам: **кто оперирует** сервисом и **кто выставляет счёт**.

| Площадка | Оператор | Счёт | Паритет фич |
|---|---|---|---|
| Claude API (first-party) | Anthropic | Anthropic | эталон |
| Claude Platform on AWS | **Anthropic** | AWS Marketplace (CCU) | в тот же день |
| Claude in Microsoft Foundry | Anthropic | Azure Marketplace (CCU) | по стандартным ставкам API |
| Amazon Bedrock | AWS (партнёр) | AWS | отстаёт, свои цены |
| Google Vertex AI | Google (партнёр) | Google | отстаёт, свои цены |

Ключевая развилка: **Claude Platform on AWS — это не Bedrock.** Первое оперирует Anthropic
с паритетом фич в тот же день, второе — партнёрская площадка со своим прайсом и задержкой.
Названия похожи, суть разная.

### 🎯 Зачем тебе

Выбор площадки обычно диктует не техника, а бухгалтерия: у компании есть коммит перед AWS
или Azure, и потратить его хочется через маркетплейс. Понимать при этом, что именно теряешь,
— обязательно.

### 💻 Минимальный пример

Что недоступно на партнёрских площадках (Bedrock, Vertex):

- **Managed Agents** — нет вообще. Остаётся Messages API + tool use.
- **Fast mode** — только первый API Anthropic.
- **На Vertex** веб-инструменты урезаны: доступен только базовый `web_search_20250305`,
  а web fetch отсутствует.

Региональные и мульти-региональные эндпоинты на Bedrock и Google Cloud стоят **на 10% дороже**
глобальных — начиная с Sonnet 4.5, Haiku 4.5, Opus 4.5 и всех последующих.

### ⚠️ Грабли

- **Не подставляй `base_url` в обычный клиент.** У каждой площадки свой класс клиента —
  см. отдельную статью. Подмена URL у `Anthropic()` не даст правильную авторизацию.
- **Цены Bedrock и Vertex смотри у них**, а не на странице Anthropic: это партнёрские тарифы.
  У Claude Platform on AWS и Foundry ставки как раз стандартные — просто в CCU.
- **Паритет фич не гарантирован** — то, что вышло сегодня в первом API, на партнёрской площадке
  может появиться сильно позже или не появиться.

### 🔗 Первоисточник
Pricing — platform.claude.com/docs/en/about-claude/pricing
