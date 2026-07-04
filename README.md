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
frontend/   React 18 + Vite Mini App — 7 экранов Фазы 1 реализованы
```

## Локальный старт
```bash
cp .env.example .env   # заполнить BOT_TOKEN
docker compose up -d postgres redis
DATABASE_URL=postgresql://user:pass@localhost:5432/botyard python scripts/sync_content.py
docker compose up -d

# frontend (мок-режим без реального Telegram initData — см. frontend/.env.development)
cd frontend && npm install && npm run dev
```

## Что уже реально работает
- Гейт: валидация initData, кэш подписки в Redis, деградация на PG при сбое Telegram API
- API: entries/tools/prompts/search/favorites/events/calc — рабочие роуты поверх схемы `baza`
- Калькулятор токенов: приближённый подсчёт через `tiktoken` (нет ключа Anthropic, см. §13/В-7 PROJECT_CONTEXT)
- Синк контента: `content/` (30 статей, 17 инструментов, 34 промпта, 7 шпаргалок) → БД
- Деплой: живёт на `baza.botyard.site` (порт 3015), бот админ в `@claudedry`
- Frontend: Gate/Home/База (список+статья)/Инструменты/Промпты (копирование)/Калькулятор/Поиск,
  терминальная дизайн-система §14, deep links (§16), `npm run build` проходит

## Что ещё нужно сделать
- Собрать `frontend` в Docker-образ и раскатать на сервер (сейчас есть только в репозитории,
  на VPS отдаёт только backend — нужен либо статический контейнер, либо путь-based роутинг
  в Caddy: `/api/*` и `/health` → backend:3015, всё остальное → frontend)
- GitHub-синк звёзд для tools (§8) — скрипт не написан, tools остаются published=false до него
- Self-hosted GitHub Actions runner — пока не зарегистрирован, деплой только вручную по `deploy/README.md`
- Избранное и Шпаргалки (Фаза 2) — экраны не реализованы, API для них уже есть (favorites)
