---
slug: api-embeddings
title: "Embeddings с Claude: как это устроено"
summary: "У Anthropic нет своей embeddings-модели — используются партнёрские (Voyage AI и др.). Что выбрать."
section: theory
group: models
tags: [api, embeddings, rag]
doc_url: "https://docs.claude.com/en/build-with-claude/embeddings"
sort_order: 107
published: true
---

![Embeddings](/entry-images/rag-pipeline.svg)

### ❓ Что это

У Anthropic нет собственной embeddings-модели — компания фокусируется на generation-моделях и
рекомендует партнёрские провайдеры, в первую очередь Voyage AI (прямое партнёрство и рекомендация в
официальной доке), а также любые другие эмбеддинги. Embeddings отдельны от Claude, потому что это
разные задачи: эмбеддинг превращает текст в вектор для поиска по смысловой близости, а Claude
генерирует связный ответ на основе найденного контекста.

### 🎯 Зачем тебе

Любой RAG-пайплайн: поиск релевантных чанков документации перед тем как передать их Claude,
семантический поиск по базе тикетов, дедупликация похожих вопросов. Без эмбеддингов ты либо пихаешь
всю базу знаний в контекст целиком (дорого, упирается в лимит окна), либо используешь только
keyword-поиск, который промахивается на перефразированных вопросах.

### 💻 Минимальный пример

```python
import voyageai
vo = voyageai.Client()
result = vo.embed(["Как работает checkpointing?", "..."], model="voyage-3.5", input_type="document")
vectors = result.embeddings
```

Дальше — обычный pipeline: векторы в pgvector/Pinecone/Qdrant → на запрос пользователя эмбеддишь
запрос тем же `input_type="query"` → косинусное сходство → top-k чанков → в контекст Claude.

### ⚠️ Грабли

- **`input_type` должен различаться** для документов и запросов — асимметричные эмбеддинги, перепутал
  тип — качество поиска заметно падает.
- **Модель эмбеддингов и Claude — разные счета и rate limits** — планируй капасити отдельно.
- **Голый эмбеддинг-поиск слабее contextual retrieval** — чистый vector search без гибрида с BM25
  чаще промахивается.

### 🔗 Первоисточник
Embeddings — docs.claude.com/en/build-with-claude/embeddings
