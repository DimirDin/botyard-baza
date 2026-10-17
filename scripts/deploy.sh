#!/usr/bin/env bash
# Полный деплой по §12.1 BAZA_CONTEXT одной командой: ./scripts/deploy.sh
#
# Порядок важен: контент вшит в образ, поэтому сначала пересборка, потом синк
# со сверкой отпечатка (упадёт с кодом 2, если в образе старый контент), потом
# звёзды — без них новые инструменты остаются published=false.
set -euo pipefail

HOST="${BAZA_HOST:-root@2.26.31.241}"
KEY="${BAZA_KEY:-$HOME/.ssh/botyard_baza_deploy}"
APP=/srv/apps/botyard-baza
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -i "$KEY" -o ConnectTimeout=15 "$HOST")

cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ есть незакоммиченные изменения — сервер их не увидит" >&2; exit 1
fi
git fetch -q origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "✗ HEAD не совпадает с origin/main — сначала git push" >&2; exit 1
fi

HASH="$(python3 scripts/sync_content.py --print-hash | tail -1)"
echo "→ отпечаток content/: $HASH"

echo "→ сборка фронтенда"
(cd frontend && npm run build >/dev/null)

echo "→ сервер: git pull + пересборка контейнеров"
"${SSH[@]}" "cd $APP && git pull --ff-only && docker compose up -d --build"

echo "→ синк контента со сверкой отпечатка"
"${SSH[@]}" "docker exec botyard-baza-backend-1 python scripts/sync_content.py --expect-hash $HASH"

echo "→ статика фронтенда"
rsync -az --delete -e "ssh -i $KEY" frontend/dist/ "$HOST:$APP/frontend/dist/"

# Звёзды — последним из изменяющих шагов и не фатально: протухший GITHUB_TOKEN
# (так было 17.10.2026) не должен оставлять прод без свежего фронтенда.
# Без рабочего токена публикуем хотя бы новые инструменты: их мало, лимит
# 60 req/ч без авторизации это выдерживает.
STARS_OK=1
echo "→ синк звёзд GitHub"
if ! "${SSH[@]}" "docker exec botyard-baza-backend-1 python scripts/sync_github_stars.py"; then
  STARS_OK=0
  echo "⚠ полный синк звёзд не прошёл — публикую только новые инструменты без токена"
  "${SSH[@]}" "docker exec -e GITHUB_TOKEN= botyard-baza-backend-1 python scripts/sync_github_stars.py --new-only" || true
fi

echo "→ проверка"
"${SSH[@]}" "docker ps --format '{{.Names}} {{.Status}}' | grep baza; \
  curl -fsS http://127.0.0.1:3015/api/public/counts && echo"

if [ "$STARS_OK" = 0 ]; then
  echo "⚠ готово, но GITHUB_TOKEN на сервере не работает — еженедельный cron звёзд падает. Выпусти новый PAT без скоупов и положи в .env." >&2
  exit 3
fi
echo "✓ готово. Вручную: открыть Mini App, проверить /api/gate/check и калькулятор."
