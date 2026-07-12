-- Трекинг источника трафика (vc.ru, реклама, органика) — см. BAZA_CONTEXT.md.
-- Пишется один раз при первом визите пользователя (INSERT), при повторных
-- заходах (ON CONFLICT) не перезаписывается — тот же паттерн, что у tools.published.
--
-- Применить вручную на сервере: psql "$DATABASE_URL" -f db/migrations/0007_user_source.sql

ALTER TABLE baza.users ADD COLUMN IF NOT EXISTS source TEXT;
