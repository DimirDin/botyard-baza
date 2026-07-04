"""
GitHub-синк инструментов — §8 PROJECT_CONTEXT.

Обновляет stars/stars_prev/last_commit/archived/synced_at в baza.tools и решает
публикацию: живой репозиторий (существует, не archived, коммит младше 12 мес) →
published=true, иначе published=false с логом причины.

§8 закладывал GraphQL батчами по 100 с PAT — это нужно на масштабе ~200 репо.
Сейчас в базе ~18, поэтому ходим по REST /repos/{owner}/{name} без токена
(лимит 60 req/ч на IP — с запасом). Если задан GITHUB_TOKEN — подставляем
в заголовок, лимит вырастает до 5000. На GraphQL переходить при росте списка.

Запуск: DATABASE_URL=postgresql://... python scripts/sync_github_stars.py
Расписание: cron, ночь понедельника (см. deploy/README.md).
"""
import asyncio
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

import asyncpg

DATABASE_URL = os.environ["DATABASE_URL"]
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
STALE_AFTER = timedelta(days=365)


def fetch_repo(repo: str) -> dict | None:
    """GET /repos/{owner}/{name}. None — репо не найдено (404/переехал без редиректа)."""
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}",
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "botyard-baza-sync",
            **({"Authorization": f"Bearer {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


async def main() -> None:
    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch("SELECT id, repo, stars FROM baza.tools ORDER BY repo")
    now = datetime.now(timezone.utc)
    published = gone = stale = 0

    for row in rows:
        data = fetch_repo(row["repo"])
        if data is None:
            print(f"✗ 404: {row['repo']} — оставляем published=false, кандидат на выпил")
            await conn.execute(
                "UPDATE baza.tools SET published=false, synced_at=$2 WHERE id=$1",
                row["id"], now,
            )
            gone += 1
            continue

        pushed_at = datetime.fromisoformat(data["pushed_at"].replace("Z", "+00:00"))
        archived = data["archived"]
        alive = not archived and (now - pushed_at) < STALE_AFTER
        stars = data["stargazers_count"]
        # Первый синк (stars ещё 0): stars_prev = свежему значению, иначе весь
        # счётчик звёзд показался бы как «прирост за неделю» в сортировке trending.
        stars_prev = stars if row["stars"] == 0 else row["stars"]

        await conn.execute(
            """
            UPDATE baza.tools
            SET stars_prev = $2, stars = $3, last_commit = $4,
                archived = $5, published = $6, synced_at = $7
            WHERE id = $1
            """,
            row["id"], stars_prev, stars, pushed_at, archived, alive, now,
        )
        if alive:
            published += 1
            print(f"✓ {row['repo']}: ⭐ {stars} ({stars - stars_prev:+d})")
        else:
            stale += 1
            reason = "archived" if archived else f"последний коммит {pushed_at.date()}"
            print(f"⚠ {row['repo']}: {reason} — published=false")

    await conn.close()
    print(f"\nИтог: published={published}, stale={stale}, 404={gone}, всего={len(rows)}")


if __name__ == "__main__":
    asyncio.run(main())
