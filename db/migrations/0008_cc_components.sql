-- Компоненты Claude Code из каталога aitmpl (davila7/claude-code-templates) — отдельная
-- таблица, НЕ трогает baza.entries/baza.tools. См. content/components/README.md за процессом
-- пополнения. Применить вручную на сервере:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0008_cc_components.sql
-- Идемпотентно: повторный прогон безопасен (IF NOT EXISTS везде).

CREATE TABLE IF NOT EXISTS baza.cc_components (
    id          SERIAL PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    comp_type   TEXT NOT NULL,          -- agents | commands | mcps | hooks | settings | skills | loops
    category    TEXT,                   -- подкатегория внутри типа из каталога aitmpl, свободная строка
    name        TEXT NOT NULL,          -- имя компонента в каталоге (napr. postgres-pro)
    title       TEXT NOT NULL,          -- отображаемое имя карточки
    summary     TEXT,                   -- русское описание, 1 строка
    install_cmd TEXT NOT NULL,          -- npx claude-code-templates@latest --<flag> <category/name> --yes
    doc_url     TEXT NOT NULL,          -- ссылка на исходный файл в GitHub
    sort_order  INT DEFAULT 100,
    published   BOOLEAN DEFAULT true,   -- снятие карточки = false, строку не удалять (см. README пайплайна)
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_components_type ON baza.cc_components (comp_type, sort_order);

-- FTS по русским описаниям — generated column, автоматически пересчитывается при UPDATE.
-- Известный нюанс (сознательно не чиним сейчас): русское tsvector-словарь не матчит
-- латинские термины по кириллическому написанию ("телеграм" не найдёт "Telegram").
ALTER TABLE baza.cc_components ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
        to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(name, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_cc_components_search ON baza.cc_components USING gin (search_tsv);
