-- Полнотекстовый поиск по статьям, инструментам и промптам.
-- Применить вручную ДО sync_content.py:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0010_fts_entries_tools_prompts.sql
-- Идемпотентно: повторный прогон безопасен.
--
-- Зачем. До этой миграции поиск по entries шёл через ILIKE '%q%' только по title и summary:
--   1) тело статьи (body_md) не искалось вообще — 197 статей, и содержимое каждой
--      было недоступно поиску; при этом промпты искались по body, уроки гида по body_md,
--      компоненты по tsvector. Entries были единственным разделом без поиска по тексту;
--   2) подстрока не знает морфологии: «хуков» не находило «хуки», «промптами» — «промпт».
-- Последствие было не только в UX: вкладка «🔍 спрос» в админке (события search_query
-- с total=0) считалась источником тем для контент-партий, а значительная часть этих нулей
-- была ложной — материал есть, его не находил поиск.
--
-- Паттерн повторяет baza.cc_components (миграция 0008): generated column + GIN.
-- Веса: A — заголовок, B — краткое описание, C — тело. Нужны для ts_rank,
-- чтобы совпадение в заголовке было выше совпадения в середине длинной статьи.
--
-- Известный нюанс (унаследован от 0008, сознательно не чиним): русский словарь не матчит
-- латинские термины по кириллическому написанию — «телеграм» не найдёт «Telegram».
-- Поэтому в коде поиска tsvector дополнен ILIKE-фоллбэком по trgm-индексам, которые
-- остаются на месте (idx_entries_search / idx_tools_search / idx_prompts_search).

ALTER TABLE baza.entries ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('russian', coalesce(body_md, '')), 'C')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_entries_tsv ON baza.entries USING gin (search_tsv);

-- repo идёт в вектор вместе с name: запрос «claude-code» должен находить
-- инструмент по строке owner/name, а не только по русскому описанию.
ALTER TABLE baza.tools ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(repo, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(description_ru, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_tools_tsv ON baza.tools USING gin (search_tsv);

ALTER TABLE baza.prompts ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(body, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_prompts_tsv ON baza.prompts USING gin (search_tsv);
