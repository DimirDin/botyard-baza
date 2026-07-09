-- Ссылка «читать подробнее в Базе» на дне урока гида — необязательное поле,
-- slug статьи из baza.entries (не FK, т.к. entries живут по content-as-code пайплайну
-- отдельно и могут быть переименованы/удалены независимо от гида).
--
-- Применить вручную на сервере: psql "$DATABASE_URL" -f db/migrations/0003_guide_related_entry.sql

ALTER TABLE baza.guide_lessons ADD COLUMN IF NOT EXISTS related_entry TEXT;
