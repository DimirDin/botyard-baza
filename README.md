# botyard-baza — «Baza без воды»

Telegram Mini App: русскоязычная энциклопедия по экосистеме Claude (Code / Chat / API)
с гейтом по подписке на канал [@claudedry](https://t.me/claudedry).
Бот — [@bazadry_bot](https://t.me/bazadry_bot), приложение живёт на `baza.botyard.site`.

> Подробный контекст проекта ведётся **вне репозитория** (он публичный) — см. `BAZA_CONTEXT.md`
> и `HANDOVER-baza.md` в родительском каталоге. В репозитории остаются только `CLAUDE.md`
> с командами и стилем кода и этот README.

## Структура
```
backend/    FastAPI — 14 роутеров, гейт-логика, калькулятор токенов
bot/        aiogram 3 — /start, deep links, гейт-превью (бизнес-логики нет)
db/         init.sql + migrations/ — схема baza (на сегодня 10 миграций)
content/    статьи/инструменты/промпты/шпаргалки/гид как код (YAML/MD)
scripts/    sync_content.py, sync_github_stars.py, check_links.py, menu_registry.py
frontend/   React 18 + Vite Mini App, дизайн-система «Anthropic Studio»
deploy/     Caddyfile-сниппет и инструкция по ручному деплою
docs/       планы крупных контент-партий и спека редизайна
```

## Локальный старт
`docker-compose.yml` содержит только `backend` и `bot` — PostgreSQL и Redis
общие для платформы Botyard и поднимаются отдельно, их адреса берутся из `.env`.

```bash
cp .env.example .env   # заполнить BOT_TOKEN, DATABASE_URL, REDIS_URL

# схема и миграции — до первого синка
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
for m in db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$m"; done

python scripts/sync_content.py
docker compose up -d

# frontend (мок-режим без реального Telegram initData — см. frontend/.env.development)
cd frontend && npm install && npm run dev
```

## Что работает
- **Гейт:** валидация `initData` (HMAC-SHA256, свежесть `auth_date` < 1 ч), кэш подписки
  в Redis (`subscribed` 6 ч / `not_subscribed` 60 с), деградация на PostgreSQL при сбое
  Telegram API — уже подписанных никогда не блокируем из-за недоступности API
- **API:** 14 роутеров поверх схемы `baza` — entries / tools / prompts / search / favorites /
  cheatsheets / components / guide / events / feedback / calc / home / gate / admin.
  Все защищённые ручки — через `Depends(require_subscribed)`
- **Frontend:** 12 экранов — Gate / Home / База / Инструменты / Промпты / Компоненты /
  Шпаргалки / Избранное / Гид / Калькулятор / Поиск / Админка, deep links, конструктор
  переменных в промптах, время чтения, тосты и haptic
- **Калькулятор токенов:** приближённый подсчёт через `tiktoken`; цены моделей сверяются
  с шпаргалкой автотестом `backend/tests/test_pricing_consistency.py`
- **Контент как код:** `content/` → `scripts/sync_content.py` → БД, синк атомарный
  (любая ошибка откатывает партию целиком)
- **Аналитика спроса:** событие `search_query`, ручка `GET /api/admin/search-gaps`
  и вкладка «🔍 спрос» в админке — что искали и не нашли
- **Тесты:** backend 33 (`pytest`), frontend 40 (`vitest`)

## Объём контента (в `content/`, сверено с файлами)
| Раздел | Кол-во | Групп |
|---|---|---|
| Статьи (`entries/`) | 185 | 31 |
| Инструменты (`tools.yaml`) | 348 | 33 |
| Промпты (`prompts.yaml`) | 456 | 34 |
| Шпаргалки (`cheatsheets/`) | 24 | — |
| Уроки гида (`guide/1..5/`) | 40 | 5 уровней |

**Инвариант:** ни одна группа любого раздела не содержит меньше 5 карточек.

## Правила работы с контентом
```bash
# до коммита партии — проверка картинок (офлайн) и doc_url (сеть, ~6 с на 115 ссылок)
python scripts/check_links.py

# синк: без флага показывает осиротевшие строки и ничего не трогает
python scripts/sync_content.py
python scripts/sync_content.py --prune          # удалить осиротевшие строки
python scripts/sync_content.py --print-hash     # отпечаток content/
python scripts/sync_content.py --expect-hash …  # упадёт, если в образе старый контент
```

⚠️ **Три грабли, на которые уже наступали:**
1. **Контент вшит в Docker-образ** (`COPY content ./content`). Синк через `docker exec`
   без `docker compose up -d --build` зальёт **старый** контент и отрапортует об успехе.
   Всегда пересобирайте образ или используйте `--expect-hash`.
2. **`tools.published = false` по умолчанию.** Инструмент становится видимым только после
   `scripts/sync_github_stars.py` — реальной проверки, что репозиторий существует (не 404).
3. **Цены моделей — только из `content/cheatsheets/api-limits-and-models.md`**, не по памяти.
   Расхождение шпаргалки и кода калькулятора ловит тест, но актуальность цифр сверяется
   руками с platform.claude.com.

## Деплой
CI/CD нет — деплой вручную по SSH, доступ только по ключу
(`~/.ssh/botyard_baza_deploy`). Полная процедура — `deploy/README.md` и §12 внешнего
`BAZA_CONTEXT.md`. Синк звёзд GitHub крутится на VPS по cron в понедельник.

## Что ещё не сделано
- Self-hosted GitHub Actions runner не зарегистрирован — деплой остаётся ручным
- Grace-период для отписавшихся от канала: сейчас гейт срабатывает мгновенно
- Нет уникального арта для пятого уровня Гида (нужен внешний генератор изображений)
