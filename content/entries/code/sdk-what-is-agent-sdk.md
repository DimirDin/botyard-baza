---
slug: sdk-what-is-agent-sdk
title: "Claude Agent SDK: тот же цикл, но в твоём коде"
summary: "Библиотека, дающая агентный цикл Claude Code программно — на Python и TypeScript, внутри твоего процесса."
section: code
group: agent-sdk
tags: [agent-sdk, python, typescript, agents]
doc_url: "https://code.claude.com/docs/en/agent-sdk/overview"
sort_order: 10
published: true
---

![Agent SDK](/entry-images/agent-loop.jpg)

### ❓ Что это

**Claude Agent SDK** — библиотека, которая даёт те же инструменты, тот же агентный цикл и то же
управление контекстом, что и Claude Code, но **программно, внутри твоего процесса**. Доступна
только для Python и TypeScript.

Ключевая мысль из документации: агент — это приложение, которое само планирует шаги и вызывает
инструменты, читающие файлы, запускающие команды и правящие код. SDK избавляет от необходимости
писать цикл «вызвал модель → выполнил инструмент → вернул результат → повторил» руками.

### 🎯 Зачем тебе

В экосистеме Claude четыре разных входа, и путать их дорого:

| Что делаешь | Что берёшь | Почему |
|---|---|---|
| Строишь агента, не реализуя цикл инструментов сам | **Agent SDK** | Библиотека, крутит цикл в твоём процессе |
| Интерактивная разработка, разовые задачи из терминала | **Claude Code CLI** | Терминальный интерфейс на каждый день |
| Дёргаешь API напрямую и сам пишешь цикл | **Client SDK** | Прямой доступ к API, цикл на тебе |
| Долгие/асинхронные агенты без своей песочницы | **Managed Agents** | Хостится Anthropic, отдельный продукт |

Если языка нет в списке — документация прямо предлагает запускать CLI подпроцессом
с флагом `-p` и `--output-format json`.

### 💻 Минимальный пример

```bash
npm install @anthropic-ai/claude-agent-sdk    # TypeScript
pip install claude-agent-sdk                  # Python
export ANTHROPIC_API_KEY=your-api-key
```

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

async def main():
    async for message in query(
        prompt="Проверь utils.py на баги, из-за которых код падает. Почини найденное.",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],   # эти инструменты одобряются автоматически
            permission_mode="acceptEdits",             # правки файлов без подтверждения
        ),
    ):
        if isinstance(message, ResultMessage):
            print(f"Готово: {message.subtype}")

asyncio.run(main())
```

`query` — точка входа, возвращает асинхронный итератор. Цикл крутится, пока Claude думает, зовёт
инструменты, смотрит результаты и решает, что дальше. Заканчивается, когда модель выдаёт ответ
**без единого вызова инструмента**.

### ⚠️ Грабли

- **Ключ читается только из окружения процесса.** SDK не подхватывает `.env` сам — грузи его
  через `dotenv` до вызова, иначе получишь «API key not found».
- **Логин через claude.ai в своём продукте запрещён.** Anthropic не разрешает сторонним
  разработчикам предлагать claude.ai-логин или свои лимиты в продуктах на Agent SDK без
  предварительного согласования — только аутентификация по API-ключу.
- **Бинарник Claude Code вшит в пакет, но не всегда.** Если pip поставил sdist вместо
  платформенного wheel (например, ARM64 Windows) или npm ставился с `--omit=optional` —
  бинарника не будет, ставь Claude Code отдельно.
- **Брендинг ограничен.** Называть свой продукт «Claude Code» или «Claude Code Agent» нельзя;
  допустимо «Claude Agent» или «{ИмяТвоегоАгента} Powered by Claude».

### 🔗 Первоисточник
Agent SDK overview — code.claude.com/docs/en/agent-sdk/overview
