# botyard-baza — «Baza без воды»

Telegram Mini App: энциклопедия по Claude Code / Claude.ai / API с гейтом по подписке
на @claudedry. Полная спецификация — в `PROJECT_CONTEXT.md`.

## Структура
```
backend/    FastAPI — API, гейт-логика, калькулятор токенов
bot/        aiogram — /start, deep links, гейт-превью
db/         init.sql — схема baza
content/    статьи/инструменты/промпты/шпаргалки как код (YAML/MD)
scripts/    sync_content.py — заливка content/ в БД
frontend/   React Mini App (заготовка, ещё не наполнена)
```

## Локальный старт
```bash
cp .env.example .env   # заполнить BOT_TOKEN и ANTHROPIC_API_KEY
docker compose up -d postgres redis
DATABASE_URL=postgresql://user:pass@localhost:5432/botyard python scripts/sync_content.py
docker compose up -d
```

## Что уже реально работает
- Гейт: валидация initData, кэш подписки в Redis, деградация на PG при сбое Telegram API
- API: entries/tools/prompts/search/favorites/events/calc — рабочие роуты поверх схемы `baza`
- Калькулятор токенов: реальный `count_tokens`, платный EN-перевод через Haiku с rate-limit
- Синк контента: `content/` (30 статей, 17 инструментов, 34 промпта, 7 шпаргалок) → БД

## Что ещё нужно сделать
- `frontend/` — React Mini App пуст, нужна реализация экранов из §14 PROJECT_CONTEXT
- GitHub-синк звёзд для tools (§8) — скрипт не написан, tools остаются published=false до него
- Деплой на VPS: Caddy, self-hosted runner, добавление бота админом в канал — вне зоны доступа этой сессии
