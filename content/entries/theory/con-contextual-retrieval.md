---
slug: con-contextual-retrieval
title: "Contextual Retrieval: RAG, который реже промахивается"
summary: "Contextual Embeddings + BM25 снижают провалы retrieval на 49–67%. Рецепт от Anthropic."
section: theory
group: agentic-patterns
tags: [rag, retrieval, engineering]
doc_url: "https://www.anthropic.com/engineering/contextual-retrieval"
sort_order: 127
published: true
---

![Contextual Retrieval](/entry-images/rag-pipeline.svg)

### ❓ Что это

Метод от Anthropic, снижающий долю промахов классического RAG на 49–67% по их бенчмаркам. Проблема
классического подхода: чанк документа теряет контекст всего документа при эмбеддинге. Contextual
Retrieval добавляет короткое пояснение к каждому чанку перед эмбеддингом — LLM генерирует 1-2
предложения, объясняющие, что это за чанк и откуда он, и приклеивает их к чанку до индексации.

#### Contextual Embeddings + BM25

Второй компонент — гибридный поиск: dense-эмбеддинги плюс классический BM25 с объединением
результатов. Компенсирует слабость чистых эмбеддингов на точных идентификаторах (номера статей,
коды ошибок), которые семантический поиск иногда «размывает».

### 🎯 Зачем тебе

RAG-продукт с заметной долей нерелевантных ответов — документация с похожими разделами, юридические
тексты со сложными ссылками, базы знаний с контекстно-зависимыми ответами.

### 💻 Минимальный пример

```python
def contextualize_chunk(full_document, chunk):
    prompt = f"Документ:\n{full_document}\n\nФрагмент:\n{chunk}\n\nДай короткий контекст фрагмента."
    context = call_claude(prompt, model="claude-haiku-4-5")
    return f"{context}\n\n{chunk}"
# индексируем результат и в dense-эмбеддинг, и в BM25
```

С prompt caching генерация контекста для тысяч чанков одного документа обходится ощутимо дешевле.

### ⚠️ Грабли

- **Без prompt caching контекстуализация тысяч чанков дорога** — экономия критична за счёт
  кэширования стабильного префикса документа.
- **Не заменяет reranking** — Anthropic рекомендует добавлять reranking поверх гибридного поиска.
- **Метод не бесплатен по инфраструктуре** — нужен отдельный BM25-индекс в дополнение к векторной БД.

### 🔗 Первоисточник
Contextual Retrieval — anthropic.com/engineering/contextual-retrieval
