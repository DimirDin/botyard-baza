---
slug: api-agent-skills
title: "Agent Skills в API: как получить .pptx и .xlsx из модели"
summary: "container со скиллами плюс code execution — и почему это не Managed Agents, хотя слово «агент» есть в обоих."
section: theory
group: api-tools
tags: [api, skills, files]
doc_url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
sort_order: 232
published: true
---

### ❓ Что это

**Agent Skills** в API позволяют Claude сгенерировать настоящий файл — презентацию, таблицу,
документ, PDF — а не текстовое описание того, что могло бы в нём быть.

Механика: обычный `client.beta.messages.create`, в него передаётся `container` со списком
скиллов и инструмент code execution. Файл собирается в песочнице и возвращается через Files API.

**Это не Managed Agents.** Здесь не участвуют ни `client.beta.agents`, ни сессии, ни окружения.
Слово «агент» в названии общее, продукты разные — путаница на этом месте стоит людям часов.

### 🎯 Зачем тебе

Отчёты, выгрузки, презентации — всё, что заказчик ждёт файлом. В песочнице уже стоят
`python-docx`, `python-pptx`, `matplotlib`, `pillow` и `pypdf`, поэтому просить модель
«напиши код, я сам запущу» не нужно.

### 💻 Минимальный пример

```python
resp = client.beta.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={"skills": [{"skill_id": "pptx", "type": "anthropic"}]},
    tools=[{"type": "code_execution_20260521", "name": "code_execution"}],
    messages=[{"role": "user", "content": "Собери презентацию по этим данным: ..."}],
)
```

Нужны **оба** бета-флага — один на выполнение кода, второй на скиллы.

### ⚠️ Грабли

- **Тип результата — `bash_code_execution_tool_result`**, а не голый `code_execution_tool_result`.
  Перебирая `response.content`, матчись на правильный тип, иначе не найдёшь вывод.
- **Стоимость code execution.** Бесплатно, когда используется вместе с web search или web fetch
  версии `20260209` и новее. Отдельно — по времени выполнения: минимум 5 минут за вызов,
  1 550 бесплатных часов в месяц на организацию, дальше $0.05 за час на контейнер.
- **Приложенные файлы тарифицируются, даже если тул не позвали** — они предзагружаются
  в контейнер, и время идёт.
- **Не объявляй `code_execution` отдельно рядом с `web_search_20260209`** — там выполнение кода
  уже встроено, вторая песочница путает модель.

### 🔗 Первоисточник
Tool use overview — platform.claude.com/docs/en/agents-and-tools/tool-use/overview
