---
slug: plat-aws-ccu
title: "Claude Platform on AWS и биллинг в CCU"
summary: "Anthropic-операруемая площадка со счётом через AWS Marketplace: что такое Claude Consumption Unit и почему в счёте одна строка."
section: theory
group: platforms
tags: [platforms, aws, pricing]
doc_url: "https://platform.claude.com/docs/en/build-with-claude/claude-platform-on-aws"
sort_order: 311
published: true
---

### ❓ Что это

**Claude Platform on AWS** — площадка, которую оперирует **Anthropic**, а счёт выставляет
AWS Marketplace. Паритет с первым API — в тот же день.

Единица счёта — **CCU (Claude Consumption Unit)**, фиксированно **$0.01 за CCU**.
Сто CCU = один доллар.

Цепочка расчёта: токены тарифицируются в долларах по стандартным ставкам модели → применяется
твоя скидка → результат конвертируется в CCU → количество CCU почасово уезжает в AWS Marketplace.

### 🎯 Зачем тебе

Если у компании есть обязательства перед AWS, это способ потратить их на Claude, не теряя
свежести фич — в отличие от Bedrock.

### 💻 Минимальный пример

Как читается счёт:

| Параметр | Значение |
|---|---|
| Единица | CCU, $0.01 фиксировано |
| Метрика | почасовая отправка в Marketplace, счёт помесячно |
| Оплата | только постоплата, предоплаченных кредитов нет |
| Скидки | применяются как **меньшее число CCU**, цена CCU не меняется |
| Налоги | считается до налогов, налоги на стороне Marketplace |

В счёте AWS будет **одна строка** с CCU. Детальная разбивка — в консоли Claude,
доступ к ней идёт через AWS Console.

### ⚠️ Грабли

- **Скидка не меняет цену CCU.** Она уменьшает количество CCU. Если ждёшь увидеть в счёте
  «CCU по $0.008» — не увидишь.
- **Managed Agents здесь работают**, и токены с runtime тоже конвертируются в CCU
  по стандартной схеме — в отличие от Bedrock/Vertex, где CMA нет вовсе.
- **Fast mode на Claude Platform on AWS недоступен** — он только на первом API Anthropic.
- **Существующий приватный оффер Bedrock** не переносится сам: если он есть, свяжись
  с представителем до старта, задним числом скидки не применяются.

### 🔗 Первоисточник
Claude Platform on AWS — platform.claude.com/docs/en/build-with-claude/claude-platform-on-aws
