-- Кросс-ссылки урока Гида на инструменты/промпты (см. BAZA_CONTEXT.md, план редизайна Гида
-- 2026-07-11) — блок "Смотри также" под текстом урока, доп. к уже существующему related_entry.
-- Храним repo/slug как массивы строк, не FK (те же соображения, что и у related_entry —
-- tools/prompts живут по своему content-as-code пайплайну независимо от Гида).
--
-- Применить вручную на сервере: psql "$DATABASE_URL" -f db/migrations/0006_guide_related_content.sql

ALTER TABLE baza.guide_lessons ADD COLUMN IF NOT EXISTS related_tools TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE baza.guide_lessons ADD COLUMN IF NOT EXISTS related_prompts TEXT[] NOT NULL DEFAULT '{}';
