-- Добавляет body_md — реальный текст компонента (промпт агента/содержимое хука-конфига/скилла),
-- скачанный с GitHub скриптом content/components/fetch_bodies.py. Используется детальной
-- страницей компонента (GET /api/components/{slug}). Идемпотентно, применить вручную:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0009_cc_components_body.sql

ALTER TABLE baza.cc_components ADD COLUMN IF NOT EXISTS body_md TEXT;
