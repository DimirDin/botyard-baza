-- Раздел «Новости» (см. BAZA_CONTEXT.md §15) — отдельная таблица, а не
-- section="news" поверх entries: новости сортируются по published_at
-- (не updated_at/sort_order) и не участвуют в табах/группах BASE_MENU.
--
-- Применить вручную на сервере: psql "$DATABASE_URL" -f db/migrations/0005_news.sql

CREATE TABLE IF NOT EXISTS baza.news (
    id           SERIAL PRIMARY KEY,
    slug         TEXT UNIQUE NOT NULL,
    title        TEXT NOT NULL,
    summary      TEXT,
    body_md      TEXT,
    doc_url      TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    published    BOOLEAN NOT NULL DEFAULT true,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON baza.news (published_at DESC);
