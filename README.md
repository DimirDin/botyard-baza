# botyard-baza — «Baza без воды»

Telegram Mini App: энциклопедия по Claude Code / Claude.ai / API с гейтом по подписке
на @claudedry.

> Подробный контекст проекта ведётся **вне репозитория** (он публичный) — см. `BAZA_CONTEXT.md`
> и `HANDOVER-baza.md` в родительском каталоге. В репозитории остаётся только `CLAUDE.md`
> с командами и стилем кода.

## Структура
```
backend/    FastAPI — API, гейт-логика, калькулятор токенов
bot/        aiogram — /start, deep links, гейт-превью
db/         init.sql + migrations/ — схема baza
content/    статьи/инструменты/промпты/шпаргалки/гид как код (YAML/MD)
scripts/    sync_content.py — заливка content/ в БД, sync_github_stars.py — звёзды и публикация
frontend/   React 18 + Vite Mini App
deploy/     Caddyfile-сниппет и инструкция по ручному деплою
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
- Гейт: валидация initData, кэш подписки в Redis (subscribed 6 ч / not_subscribed 60 с),
  деградация на PG при сбое Telegram API
- API: 14 роутеров поверх схемы `baza` — entries/tools/prompts/search/favorites/cheatsheets/
  components/guide/events/feedback/calc/home/gate/admin
- Калькулятор токенов: приближённый подсчёт через `tiktoken`
- Синк контента: `content/` (121 статья, 310 инструментов, 323 промпта, 7 шпаргалок,
  28 уроков гида) → БД
- Деплой: живёт на `baza.botyard.site` (порт 3015 на loopback, наружу через Caddy),
  бот админ в `@claudedry`
- Frontend: 13 экранов — Gate/Home/База/Инструменты/Промпты/Компоненты/Шпаргалки/Избранное/
  Гид/Калькулятор/Поиск/Админка, дизайн-система «Anthropic Studio», deep links
- Тесты: unit-тесты гейта (`backend/tests/`) и утилит фронтенда (vitest)

## Что ещё нужно сделать
- Self-hosted GitHub Actions runner не зарегистрирован — деплой ручной по `deploy/README.md`
- Cron на VPS для периодического `scripts/sync_github_stars.py` (сейчас запускается руками
  при деплое; без него новые инструменты остаются `published=false`)
- Grace-период для отписавшихся от канала — сейчас гейт срабатывает мгновенно
- Интерактивная подстановка переменных в промптах (`{код}`, `{язык}`, `{стек}`) перед копированием
