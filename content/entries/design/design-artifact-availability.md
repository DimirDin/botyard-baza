---
slug: design-artifact-availability
title: "Почему артефакт не публикуется"
summary: "Пять условий, каждое из которых обязательно — и как это выглядит, когда одно не выполнено."
section: design
group: export
tags: [artifacts, troubleshooting, availability]
doc_url: "https://code.claude.com/docs/en/artifacts"
sort_order: 50
published: true
---

![Доступность](/entry-images/plan-mode-flow.jpg)

### ❓ Что это

Если Claude пишет локальный HTML-файл без ссылки или отвечает, что опубликовать не может —
инструмент не включён для сессии. Условий пять, и нужны **все**:

| Требование | Когда выполнено |
|---|---|
| План | Pro, Max, Team или Enterprise. На Enterprise включает Owner в админ-настройках |
| Аутентификация | Сессия под аккаунтом claude.ai — вход через `/login`. Сессии на API-ключе, gateway-токене или облачных креденшелах публиковать не могут |
| Провайдер модели | Только Anthropic API. Не работает на Amazon Bedrock, Google Cloud Agent Platform и Microsoft Foundry |
| Политика организации | Не включены CMEK, HIPAA и Zero Data Retention |
| Поверхность | Claude Code CLI 2.1.183+ либо десктоп 1.13576.0+ |

### 🎯 Зачем тебе

Самая частая непонятная ситуация — «у коллеги работает, у меня нет». Обычно причина в
строке про аутентификацию: сессия на API-ключе выглядит совершенно рабочей, но
публиковать не умеет по определению.

Отдельно стоит знать, что **в Agent SDK, GitHub Action и MCP-серверных контекстах
артефакты выключены по умолчанию**, а также когда выставлен
`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`.

### 💻 Минимальный пример

Выключить артефакты для своих сессий, независимо от настройки организации:

```
Файл настроек:        "disableArtifact": true
Переменная окружения: CLAUDE_CODE_DISABLE_ARTIFACT=1
Правило разрешений:   добавить Artifact в permissions.deny
```

Отключить автооткрытие браузера при публикации — `CLAUDE_CODE_ARTIFACT_AUTO_OPEN=0`.

### ⚠️ Грабли

- **Корпоративный файрвол.** Просмотрщик грузит артефакт с песочничного домена
  `*.claudeusercontent.com` — его нужно добавить в allowlist рядом с `claude.ai`.
- **ZDR и HIPAA выключают артефакты целиком.** Это не настройка, которую можно обойти
  на уровне сессии.
- **Локальный HTML-файл без ссылки — это симптом, а не результат.** Значит, одно из пяти
  условий не выполнено.

### 🔗 Первоисточник
Availability — code.claude.com/docs/en/artifacts#availability
