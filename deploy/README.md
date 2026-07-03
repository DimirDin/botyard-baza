# Деплой botyard-baza на платформу

Разовая настройка на сервере (см. §7 MASTER_CONTEXT для общего паттерна платформы).

## 1. Папка приложения и секреты
```bash
mkdir -p /srv/apps/botyard-baza
cd /srv/apps/botyard-baza
git clone git@github.com:DimirDin/botyard-baza.git .
cp .env.example .env
vim .env        # заполнить BOT_TOKEN, ANTHROPIC_API_KEY, DATABASE_URL (общий platform_postgres,
                 # схема baza), REDIS_URL (общий platform_redis, префикс baza:)
chmod 600 .env
```

## 2. Схема БД
Применить `db/init.sql` на общем `platform_postgres` (БД `botyard`, схема `baza`):
```bash
psql "$DATABASE_URL" -f db/init.sql
```

## 3. Caddy
Добавить блок из `deploy/Caddyfile.snippet` в `/etc/caddy/Caddyfile`, затем:
```bash
caddy reload
```
Поддомен `baza.botyard.site` должен быть заранее направлен (DNS A-запись) на IP сервера.

## 4. Self-hosted GitHub Actions runner
В репозитории `DimirDin/botyard-baza` на GitHub: Settings → Actions → Runners → New self-hosted runner.
```bash
mkdir -p /srv/runners/botyard-baza && cd /srv/runners/botyard-baza
# ... скачать/распаковать runner по инструкции GitHub ...
RUNNER_ALLOW_RUNASROOT=1 ./config.sh --url https://github.com/DimirDin/botyard-baza --token <TOKEN>
./svc.sh install root
./svc.sh start
```
После этого push в `main` триггерит `.github/workflows/deploy.yml`: rsync кода → `docker compose -f docker-compose.prod.yml build/up` → синк `content/` в БД.

## 5. Первый запуск (вручную, без раннера — fallback)
```bash
cd /srv/apps/botyard-baza
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
DATABASE_URL=... python3 scripts/sync_content.py
```

## 6. Гейт-бот в канале
Добавить `@bazadry_bot` администратором в `@claudedry` (без прав публикации) — без этого
`getChatMember` для проверки подписки не работает (см. §5 PROJECT_CONTEXT).

## 7. Проверка
```bash
curl https://baza.botyard.site/health   # {"status": "ok"}
```
Смок-тест гейта — вручную по §5 PROJECT_CONTEXT: initData → /api/gate/check → отказ без
подписки → подписка → /api/gate/recheck → доступ.
