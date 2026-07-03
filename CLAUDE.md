# botyard-baza — Claude Code Instructions

Telegram Mini App «Baza без воды» — энциклопедия по Claude Code/Claude.ai/API с гейтом
по подписке на @claudedry. **Полная спецификация — читай `PROJECT_CONTEXT.md` в корне
репозитория перед любой архитектурной правкой.** Он приоритетнее этого файла для решений
о продукте; этот файл — только команды и стиль кода.

## Build & Test
```bash
# backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 3015

# bot
cd bot && pip install aiogram==3.*
python main.py

# полный стек локально
docker compose up -d postgres redis
DATABASE_URL=postgresql://user:pass@localhost:5432/botyard python scripts/sync_content.py
docker compose up -d

# frontend (когда появится package.json)
cd frontend && npm install && npm run dev
```

## Архитектура (не менять без явного запроса)
- Backend: FastAPI + asyncpg, порт 3015, схема PostgreSQL `baza`, Redis-префикс `baza:`
- Bot: aiogram 3, роль минимальная — `/start`, deep links, гейт-превью. Вся логика — в backend через API
- Frontend: React 18 + Vite, Telegram Mini App SDK, эстетика «терминал в духе oh-my-zsh» (палитра и паттерны — §14 PROJECT_CONTEXT)
- Контент — как код: `content/entries/*.md`, `content/tools.yaml`, `content/prompts.yaml`, `content/cheatsheets/*.md` → `scripts/sync_content.py` → БД. Никогда не пиши в БД контент напрямую мимо этого пайплайна
- Гейт (`backend/app/gate.py`) — не менять логику TTL/деградации без сверки с §5 PROJECT_CONTEXT, это самая чувствительная часть продукта

## Code Style
- Python 3.12+, type hints везде, async для всех БД-вызовов
- FastAPI-роуты: один файл — один ресурс, паттерн уже задан в `backend/app/routers/`
- Все защищённые ручки — через `Depends(require_subscribed)`, см. `app/deps.py`
- Никогда не коммить `.env`, ключи, токены — только `.env.example` с пустыми значениями

## Важные факты (чтобы не выдумывать заново)
- Цены моделей и лимиты — только по `content/cheatsheets/api-limits-and-models.md`, не по памяти. Если нужна свежая цена — сверяй с platform.claude.com/docs/en/about-claude/pricing
- Реальные slash-команды/флаги Claude Code — только по `content/cheatsheets/cc-*.md`, не по общеизвестным «народным» промпт-подборкам (там встречаются ошибки — см. Changelog 0.6 в PROJECT_CONTEXT)
- `tools.published = false` по умолчанию — включать вручную только после GitHub-синка звёзд (задача ещё не реализована, см. §8 PROJECT_CONTEXT)

## Definition of done для любой фичи
1. Работает локально через `docker compose up`
2. Не ломает гейт-флоу (проверить `/api/gate/check` вручную)
3. PROJECT_CONTEXT.md обновлён, если менялась архитектура/схема/API-контракт
