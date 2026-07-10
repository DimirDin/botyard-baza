-- Рейтинг статей 👍/👎 — дешёвый сигнал для приоритизации доработки контента (см. BAZA_CONTEXT.md §15).
CREATE TABLE IF NOT EXISTS baza.entry_ratings (
    tg_id       BIGINT NOT NULL,
    entry_id    INT NOT NULL REFERENCES baza.entries(id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    rated_at    TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tg_id, entry_id)
);
