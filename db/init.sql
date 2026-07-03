-- db/init.sql — схема baza для botyard-baza
-- Применять на общем PostgreSQL Botyard: psql -f init.sql

CREATE SCHEMA IF NOT EXISTS baza;

CREATE TABLE IF NOT EXISTS baza.users (
    tg_id           BIGINT PRIMARY KEY,
    username        TEXT,
    first_seen      TIMESTAMPTZ DEFAULT now(),
    last_seen       TIMESTAMPTZ,
    is_subscribed   BOOLEAN DEFAULT false,
    sub_checked_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS baza.entries (
    id          SERIAL PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    section     TEXT NOT NULL,          -- code | chat | api | concepts
    title       TEXT NOT NULL,
    summary     TEXT,
    body_md     TEXT NOT NULL,
    doc_url     TEXT,
    tags        TEXT[] DEFAULT '{}',
    sort_order  INT DEFAULT 100,
    published   BOOLEAN DEFAULT true,
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entries_section ON baza.entries (section, sort_order);

CREATE TABLE IF NOT EXISTS baza.tools (
    id              SERIAL PRIMARY KEY,
    repo            TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL,
    description_ru  TEXT NOT NULL,
    badge           TEXT,
    stars           INT DEFAULT 0,
    stars_prev      INT DEFAULT 0,
    last_commit     TIMESTAMPTZ,
    archived        BOOLEAN DEFAULT false,
    verify_status   TEXT DEFAULT 'check',  -- known | check
    published       BOOLEAN DEFAULT false, -- вручную true только после github-синка
    added_at        TIMESTAMPTZ DEFAULT now(),
    synced_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tools_category ON baza.tools (category);

CREATE TABLE IF NOT EXISTS baza.prompts (
    id           SERIAL PRIMARY KEY,
    slug         TEXT UNIQUE NOT NULL,
    category     TEXT NOT NULL,
    title        TEXT NOT NULL,
    body         TEXT NOT NULL,
    comment      TEXT,
    copies_count INT DEFAULT 0,
    published    BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON baza.prompts (category);

CREATE TABLE IF NOT EXISTS baza.cheatsheets (
    id          SERIAL PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    body_md     TEXT NOT NULL,
    sort_order  INT DEFAULT 100,
    published   BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS baza.favorites (
    tg_id      BIGINT REFERENCES baza.users(tg_id),
    item_type  TEXT NOT NULL,   -- entry | tool | prompt
    item_id    INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tg_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS baza.events (
    id         BIGSERIAL PRIMARY KEY,
    tg_id      BIGINT,
    event      TEXT NOT NULL,
    payload    JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_type ON baza.events (event, created_at);

-- pg_trgm для поиска по entries/tools/prompts (§6: старт на trgm, tsvector если не хватит)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_entries_search ON baza.entries USING gin (title gin_trgm_ops, summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tools_search ON baza.tools USING gin (name gin_trgm_ops, description_ru gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_search ON baza.prompts USING gin (title gin_trgm_ops, body gin_trgm_ops);
