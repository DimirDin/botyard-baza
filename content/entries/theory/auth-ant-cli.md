---
slug: auth-ant-cli
title: "ant CLI: профили вместо переменной окружения"
summary: "ant auth login, именованные профили, короткоживущие токены для curl и почему OAuth-запрос идёт другим заголовком."
section: theory
group: auth
tags: [auth, cli, oauth]
doc_url: "https://platform.claude.com/docs/en/api/overview"
sort_order: 321
published: true
---

### ❓ Что это

**`ant`** — официальный CLI Anthropic. Помимо прочего он решает вопрос авторизации:
`ant auth login` кладёт профиль в `~/.config/anthropic/`, и дальше все SDK читают его сами.

Ключ в переменной окружения перестаёт быть единственным способом жить.

### 🎯 Зачем тебе

- Несколько аккаунтов или воркспейсов на одной машине — именованные профили вместо жонглирования
  экспортом.
- Не держать долгоживущий секрет в шелле и в истории команд.
- В CI и локально — одна и та же схема.

Отдельно `ant` — это ещё и control plane для Managed Agents: агентов и окружения рекомендуется
описывать YAML в репозитории и применять именно через CLI.

### 💻 Минимальный пример

```bash
ant auth login          # завести профиль
ant auth status         # какой источник активен сейчас
```

Для сырого `curl` нужен короткоживущий токен — и, внимание, **другой заголовок**:

```bash
TOKEN=$(ant auth print-credentials --access-token)

curl https://api.anthropic.com/v1/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "anthropic-beta: oauth-2025-04-20" \
  -H "content-type: application/json" \
  -d '{"model":"claude-opus-5","max_tokens":1024,"messages":[{"role":"user","content":"привет"}]}'
```

### ⚠️ Грабли

- **OAuth-токен идёт в `Authorization: Bearer`, а не в `x-api-key`.** Переделка curl
  с ключа на профиль — это смена заголовка, а не подстановка другого значения. Плюс обязателен
  `anthropic-beta: oauth-2025-04-20`.
- **`--access-token` обязателен.** Без флага `print-credentials` печатает JSON, а не голый токен,
  и подстановка в переменную даст мусор.
- **Refresh-токены истекают.** Долгоживущий CI на профиле однажды встанет — там уместнее
  сервисный аккаунт или federation.
- **Для SDK и самого `ant` токен доставать не нужно вообще** — они читают профиль сами.
  Ручное извлечение нужно только для сырого HTTP.

### 🔗 Первоисточник
Anthropic API overview — platform.claude.com/docs/en/api/overview
