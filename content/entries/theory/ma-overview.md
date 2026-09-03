---
slug: ma-overview
title: "Managed Agents: агент, которого хостит Anthropic"
summary: "Третья поверхность после Messages API и Agent SDK: Anthropic крутит агентный цикл и держит песочницу, ты присылаешь только конфиг."
section: theory
group: managed-agents
tags: [managed-agents, agents, api]
doc_url: "https://platform.claude.com/docs/en/managed-agents/overview"
sort_order: 300
published: true
---

![Managed Agents](/entry-images/agent-loop.jpg)

### ❓ Что это

**Claude Managed Agents (CMA)** — поверхность API, где Anthropic берёт на себя две вещи сразу:
крутит агентный цикл **и** хостит контейнер, в котором выполняются инструменты. Ты создаёшь
персистентный версионируемый конфиг агента (`POST /v1/agents`), а потом запускаешь сессии,
которые на него ссылаются.

Чтобы не путаться в трёх похожих вещах, держи в голове две оси: **кто даёт харнесс**
(цикл + управление контекстом) и **кто даёт деплой** (инфраструктуру, где всё крутится).

| Подход | Харнесс | Деплой |
|---|---|---|
| Messages API, ручной цикл | твой | твой |
| Tool Runner (`client.beta.messages.tool_runner`) | SDK | твой |
| **Managed Agents** | **Anthropic** | **Anthropic** |
| Claude Agent SDK (отдельный продукт) | SDK | твой |

Managed Agents — **единственный** вариант, где Anthropic закрывает обе оси. Именно поэтому
Tool Runner и Agent SDK так легко с ним спутать: они дают харнесс, но деплой всё равно твой.

### 🎯 Зачем тебе

- **Долгие многоходовые сессии** — контейнер живёт вместе с сессией, файлы между ходами не теряются.
- **Версионируемые конфиги** — агент это сохранённый объект, сессия прибивается к его версии.
  Обновил агента — старые сессии продолжают работать на своей.
- **Не нужно поднимать песочницу** — bash, файловые операции и запуск кода уже есть внутри.
- **Расписание без своего планировщика** — см. отдельную статью про scheduled deployments.

Если тебе нужен просто вызов модели или пайплайн, где логику держишь ты, — это лишний вес.
Начинай с самого простого уровня, который решает задачу.

### 💻 Минимальный пример

Обязательный порядок: **агент создаётся один раз, сессия — на каждый запуск**.
`model`, `system` и `tools` живут на агенте, на сессии их не бывает.

```python
# 1. Один раз — control plane. В request path этого быть не должно.
agent = client.beta.agents.create(
    model="claude-opus-5",
    system="Ты разбираешь логи и находишь причину падения.",
    tools=[{"type": "bash_20250124", "name": "bash"}],
)
AGENT_ID = agent.id   # сохрани и переиспользуй

# 2. На каждый запуск — data plane
session = client.beta.sessions.create(agent_id=AGENT_ID)
```

Бета-заголовок `managed-agents-2026-04-01` SDK проставляет сам для всех вызовов
`client.beta.{agents,environments,sessions,vaults,memory_stores,deployments,deployment_runs}`.

Рекомендуемый способ — держать агентов и окружения YAML-файлами в репозитории и применять
их через `ant` CLI: control plane за CLI, data plane (`sessions.create`) за твоим кодом.

### ⚠️ Грабли

- **`agents.create()` в обработчике запроса** — самая частая ошибка. Каждый вызов плодит нового
  агента. Создай один раз, положи id в конфиг, дальше только `sessions.create`.
- **Попытка передать `model` в сессию** — не сработает, это поле агента. Нужна другая модель —
  нужен другой агент (или новая версия).
- **CMA — это не Agent Skills.** Генерация `.pptx`/`.xlsx` через `container={"skills": [...]}` идёт
  обычным `client.beta.messages.create`, а не через `client.beta.agents`. Разные продукты
  с похожими словами.
- **Недоступно на партнёрских площадках** — Bedrock, Vertex и Foundry сюда не входят. Там
  остаётся Messages API + tool use.

### 🔗 Первоисточник
Managed Agents overview — platform.claude.com/docs/en/managed-agents/overview
