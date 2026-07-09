-- Раздел "Гид" — линейный путь обучения Claude, 4 уровня, с прогрессом по пользователю.
-- Точечная миграция для уже существующей прод-БД (init.sql тоже содержит эти таблицы
-- для свежих установок).
--
-- Применить вручную на сервере: psql "$DATABASE_URL" -f db/migrations/0002_guide.sql

CREATE TABLE IF NOT EXISTS baza.guide_lessons (
    id             SERIAL PRIMARY KEY,
    slug           TEXT UNIQUE NOT NULL,
    level          SMALLINT NOT NULL,              -- 1..4
    title          TEXT NOT NULL,
    summary        TEXT NOT NULL,
    body_md        TEXT NOT NULL,
    doc_url        TEXT,
    order_in_level SMALLINT NOT NULL,
    published      BOOLEAN DEFAULT true,
    updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guide_lessons_level ON baza.guide_lessons (level, order_in_level);

CREATE TABLE IF NOT EXISTS baza.guide_progress (
    tg_id        BIGINT NOT NULL REFERENCES baza.users(tg_id),
    lesson_id    INT NOT NULL REFERENCES baza.guide_lessons(id),
    completed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tg_id, lesson_id)
);
