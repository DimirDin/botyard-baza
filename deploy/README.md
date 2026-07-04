# Деплой botyard-baza на платформу

Статус на 2026-07-04: **пункты 1–3, 5–7 выполнены** (задеплоено вручную на `baza.botyard.site`,
порт 3015). Пункт 4 (self-hosted runner) сознательно пропущен — деплой пока только вручную,
повторить шаг 5 после каждого пуша. См. §7 MASTER_CONTEXT для общего паттерна платформы.

## 1. Папка приложения и секреты ✅
```bash
mkdir -p /srv/apps/botyard-baza
cd /srv/apps/botyard-baza
git clone https://github.com/DimirDin/botyard-baza.git .
cp .env.example .env
vim .env        # заполнить BOT_TOKEN, DATABASE_URL (общий platform_postgres, схема baza),
                 # REDIS_URL (общий platform_redis, префикс baza:). ANTHROPIC_API_KEY не нужен —
                 # калькулятор токенов работает локально через tiktoken, см. §13/В-7 PROJECT_CONTEXT.
chmod 600 .env
```

## 2. Схема БД ✅
Применить `db/init.sql` на общем `platform_postgres` (БД `botyard`, схема `baza`):
```bash
psql "$DATABASE_URL" -f db/init.sql
```

## 3. Caddy ✅
Добавить блок из `deploy/Caddyfile.snippet` в `/etc/caddy/Caddyfile`, затем:
```bash
caddy reload
```
Поддомен `baza.botyard.site` уже направлен (DNS A-запись) на IP сервера.

## 4. Self-hosted GitHub Actions runner — пропущено, не настроено
В репозитории `DimirDin/botyard-baza` на GitHub: Settings → Actions → Runners → New self-hosted runner.
```bash
mkdir -p /srv/runners/botyard-baza && cd /srv/runners/botyard-baza
# ... скачать/распаковать runner по инструкции GitHub ...
RUNNER_ALLOW_RUNASROOT=1 ./config.sh --url https://github.com/DimirDin/botyard-baza --token <TOKEN>
./svc.sh install root
./svc.sh start
```
После этого push в `main` будет триггерить `.github/workflows/deploy.yml` автоматически: rsync
кода → `docker compose -f docker-compose.prod.yml build/up` → синк `content/` в БД. Пока не
настроено — деплой только по шагу 5 вручную.

## 5. Деплой (вручную, без раннера — текущий рабочий способ)
```bash
cd /srv/apps/botyard-baza
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
# синк контента (если менялся content/)
docker run --rm --network host -v $(pwd):/app -w /app -e DATABASE_URL="$DATABASE_URL" \
  python:3.12-slim bash -c 'pip install --quiet asyncpg pyyaml && python scripts/sync_content.py'
# пересборка фронтенда (если менялся frontend/) — dist раздаёт Caddy как статику
docker run --rm -v $(pwd)/frontend:/app -w /app node:22-alpine sh -c 'npm ci && npm run build'
```

## 6. Гейт-бот в канале ✅
`@bazadry_bot` добавлен администратором в `@claudedry` (2026-07-04, проверено `getChatMember` →
`administrator`) — без этого проверка подписки в гейте не работала бы. Кнопка меню бота
переключена на Mini App через `setChatMenuButton` (Bot API). Для deep links вида
`t.me/bazadry_bot?startapp=...` нужно ещё включить Main Mini App в BotFather (ручной шаг).

## 7. GitHub-синк звёзд (§8) ✅
`scripts/sync_github_stars.py` — обновляет stars/last_commit/archived и публикует живые репо.
Расписание: `/etc/cron.d/botyard-baza-stars`, понедельник 03:30, лог в
`/var/log/baza-stars-sync.log`. Первый прогон выполнен 2026-07-04: 15/15 published,
4 битые записи `tools.yaml` исправлены/удалены (см. Changelog 1.1 PROJECT_CONTEXT).

## 9. Cron: синк числа подписчиков канала

`scripts/sync_subscribers_count.py` — раз в час дёргает `getChatMemberCount(@claudedry)` и пишет
результат в Redis `baza:stats:subscribers` (без TTL, перезаписывается каждым запуском). `/api/home`
читает это значение, не ходит в Bot API синхронно на каждый заход в Mini App.

```bash
cat > /etc/cron.d/botyard-baza-subscribers <<'EOF'
0 * * * * root cd /srv/apps/botyard-baza && export $(grep -E '^(BOT_TOKEN|REDIS_URL|CHANNEL_USERNAME)=' .env | xargs) && docker run --rm --network host -v /srv/apps/botyard-baza:/app -w /app -e BOT_TOKEN="$BOT_TOKEN" -e REDIS_URL="$REDIS_URL" -e CHANNEL_USERNAME="$CHANNEL_USERNAME" python:3.12-slim bash -c 'pip install --quiet redis && python scripts/sync_subscribers_count.py' >> /var/log/baza-subscribers-sync.log 2>&1
EOF
chmod 644 /etc/cron.d/botyard-baza-subscribers
```

Запуск вручную (не ждать начала часа):
```bash
ssh root@2.26.31.241
cd /srv/apps/botyard-baza && export $(grep -E '^(BOT_TOKEN|REDIS_URL|CHANNEL_USERNAME)=' .env | xargs)
docker run --rm --network host -v $(pwd):/app -w /app -e BOT_TOKEN="$BOT_TOKEN" -e REDIS_URL="$REDIS_URL" -e CHANNEL_USERNAME="$CHANNEL_USERNAME" \
  python:3.12-slim bash -c 'pip install --quiet redis && python scripts/sync_subscribers_count.py'
```

## 10. Проверка ✅
```bash
curl https://baza.botyard.site/health          # {"status": "ok"} — backend
curl -sI https://baza.botyard.site/ | head -1  # 200 — frontend (index.html)
```
Смок-тест гейта пройден: `/api/gate/check` без валидного `x-telegram-init-data` → 401, процесс
не падает. Полный цикл (подписка → доступ) — проверить вручную в реальном Telegram.
