-- Точечная миграция для уже существующей прод-БД (init.sql теперь тоже содержит эту колонку
-- для свежих установок). Nullable, дефолт NULL — старые инструменты без body_md продолжают
-- работать как раньше (страница инструмента покажет только description_ru + ссылку на GitHub).
--
-- Применить вручную на сервере: psql "$DATABASE_URL" -f db/migrations/0001_tools_body_md.sql

ALTER TABLE baza.tools ADD COLUMN IF NOT EXISTS body_md TEXT;
