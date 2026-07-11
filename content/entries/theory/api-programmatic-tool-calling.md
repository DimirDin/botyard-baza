---
slug: api-programmatic-tool-calling
title: "Programmatic tool calling: инструменты из кода в песочнице"
summary: "Claude пишет скрипт, который сам вызывает твои тулы в code execution — меньше round-trip и токенов."
section: theory
group: models
tags: [api, tools, code-execution]
doc_url: "https://docs.claude.com/en/agents-and-tools/tool-use/programmatic-tool-calling"
sort_order: 116
published: true
---

![Programmatic tool calling](/entry-images/agent-loop.jpg)

### ❓ Что это

Объединяет code execution tool и обычный tool use: вместо вызова инструментов по одному через
отдельные ходы диалога, модель пишет код, который сам оркеструет вызовы твоих тулов внутри песочницы
— циклы, условия, обработку промежуточных результатов — и возвращает только финальный результат этой
мини-программы.

### 🎯 Зачем тебе

Задачи вида «пройдись по 50 файлам и для каждого вызови линтер, собери отчёт» — без этого механизма
это 50 отдельных ходов диалога. С ним модель пишет один скрипт с циклом, который исполняется целиком
в песочнице, а в диалог возвращается готовая сводка.

### 💻 Минимальный пример

```python
results = []
for file in list_files("src/"):
    results.append(lint_tool(file))
summarize(results)
```

где `list_files`/`lint_tool`/`summarize` — твои зарегистрированные инструменты, доступные модели как
функции внутри исполняемого кода.

### ⚠️ Грабли

- **Меняет модель обработки ошибок** — падение в цикле это ошибка внутри скрипта, а не отдельный
  `tool_result` с ошибкой в диалоге.
- **Меньше видимости по шагам** — для аудита нужно логировать изнутри песочницы.
- **Не для тулов с необратимыми side-эффектами** — цикл, удаляющий/списывающий деньги 50 раз без
  паузы на подтверждение, это риск, который стоит явно ограничивать.

### 🔗 Первоисточник
Programmatic tool calling — docs.claude.com/en/agents-and-tools/tool-use/programmatic-tool-calling
