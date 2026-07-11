---
slug: api-web-search-tool
title: "Web search tool: поиск в вебе из API"
summary: "Серверный инструмент веб-поиска. max_uses, фильтры доменов, dynamic filtering через code execution."
section: theory
group: models
tags: [api, tools, web-search]
doc_url: "https://docs.claude.com/en/agents-and-tools/tool-use/web-search-tool"
sort_order: 108
published: true
---

![Web search tool](/entry-images/rag-pipeline.svg)

### ❓ Что это

Web search tool — серверный инструмент: Anthropic сам исполняет поисковый запрос и передаёт Claude
результаты (сниппеты + ссылки), без собственной интеграции с поисковым API. Модель решает, когда и
что искать, формулирует запрос, получает результаты и может уточнить поиск ещё раз.

`max_uses` ограничивает число поисковых итераций за один ответ — защита от бесконечного цикла
«поищу ещё разок».

### 🎯 Зачем тебе

Вопросы про свежие события, курсы валют, актуальные версии библиотек, факты после даты обучения
модели. Без web search Claude отвечает по знаниям на момент обучения; с инструментом — реально идёт
в сеть и цитирует найденное.

### 💻 Минимальный пример

```json
{
  "tools": [{ "type": "web_search_20250305", "name": "web_search", "max_uses": 3 }],
  "messages": [{ "role": "user", "content": "Какая цена акций X сегодня?" }]
}
```

Можно сузить домены: `"allowed_domains": ["docs.claude.com"]`. Для динамической фильтрации доменов
на лету комбинируют с code execution tool.

### ⚠️ Грабли

- **Результаты поиска — не гарантия актуальности источника** — всегда проверяй дату в сниппете.
- **`max_uses` считает итерации поиска**, не прочитанные страницы — лимит может исчерпаться на
  уточнении формулировки.
- **Тарифицируется отдельно** от обычных токенов — сверяйся с прайсингом на большом трафике.

### 🔗 Первоисточник
Web search tool — docs.claude.com/en/agents-and-tools/tool-use/web-search-tool
