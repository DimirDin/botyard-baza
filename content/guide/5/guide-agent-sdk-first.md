---
slug: guide-agent-sdk-first
level: 5
title: "Первый агент на Claude Agent SDK"
summary: "Тот же цикл, что в Claude Code, но внутри твоей программы — на Python или TypeScript."
order_in_level: 2
doc_url: "https://code.claude.com/docs/en/agent-sdk/quickstart"
related_entry: "sdk-what-is-agent-sdk"
related_tools: ["anthropics/claude-agent-sdk-python"]
---
![](/entry-images/agent-loop.jpg)

### ❓ Что это
Agent SDK даёт те же инструменты, тот же агентный цикл и то же управление контекстом, что и Claude Code, но программно — внутри твоего процесса. Доступен для Python и TypeScript.

Важно не путать четыре разные вещи: **Agent SDK** — если строишь агента и не хочешь писать цикл инструментов сам; **Claude Code CLI** — интерактивная работа из терминала; **Client SDK** — прямые вызовы API, цикл на тебе; **Managed Agents** — когда нужен долгоживущий агент без своей песочницы.

### 🎯 Зачем тебе
Как только задача становится регулярной, интерактивный терминал перестаёт подходить: нужен запуск по расписанию, по вебхуку, из очереди. SDK превращает агента в обычную функцию твоего сервиса.

### 💻 Как это выглядит на практике
```bash
pip install claude-agent-sdk
export ANTHROPIC_API_KEY=...
```

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

async def main():
    async for message in query(
        prompt="Проверь utils.py на баги и почини найденное.",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],
            permission_mode="acceptEdits",
            max_turns=20,
        ),
    ):
        if isinstance(message, ResultMessage):
            print(message.subtype, message.total_cost_usd)

asyncio.run(main())
```

Цикл крутится, пока модель не выдаст ответ **без единого вызова инструмента**. Набор инструментов задаёт класс агента: `Read`/`Glob`/`Grep` — только чтение; добавил `Edit` — правит код; добавил `Bash` — делает всё.

### 🔗 Смотри в приложении
Начни со статьи [«Claude Agent SDK: тот же цикл, но в твоём коде»](entry:sdk-what-is-agent-sdk), затем [«Агентный цикл: ходы, сообщения, чем всё кончается»](entry:sdk-agent-loop). Справочник опций — в шпаргалке «Опции Claude Agent SDK».

### ⚠️ Частая ошибка новичка
Ждать, что SDK подхватит `.env` сам. Он читает ключ из окружения процесса — если ключ лежит в файле, загрузи его сам до вызова, иначе получишь «API key not found».

Вторая — запустить без `max_turns` и `max_budget_usd` на открытой формулировке вроде «улучши эту кодовую базу». Цикл будет крутиться, пока модель не решит, что закончила.

### 🔗 Официальный источник
Agent SDK Quickstart — code.claude.com/docs/en/agent-sdk/quickstart
