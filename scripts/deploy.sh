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

echo "→ синк звёзд GitHub"
"${SSH[@]}" "docker exec botyard-baza-backend-1 python scripts/sync_github_stars.py"

echo "→ статика фронтенда"
rsync -az --delete -e "ssh -i $KEY" frontend/dist/ "$HOST:$APP/frontend/dist/"

echo "→ проверка"
"${SSH[@]}" "docker ps --format '{{.Names}} {{.Status}}' | grep baza; \
  curl -fsS http://127.0.0.1:3015/api/public/counts && echo"

echo "✓ готово. Вручную: открыть Mini App, проверить /api/gate/check и калькулятор."
