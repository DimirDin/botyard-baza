"""Разовый скрипт: засеять baza.entries.updated_at датами из git-истории.

Зачем. До исправления в sync_content.py каждый синк переписывал updated_at
у ВСЕХ строк на now(). На 197 статьях в БД было ровно одно различное значение,
то есть колонка не несла информации вообще: блок «свежее в базе» на главной
(ORDER BY updated_at DESC LIMIT 10) отдавал произвольную десятку.

Сам по себе фикс синка колонку не лечит — он лишь перестаёт её портить,
а накопленные значения так и остаются одинаковыми. Поэтому один раз
проставляем дату ПОЯВЛЕНИЯ статьи в репозитории (первый коммит, добавивший
файл): именно это и означает «свежее в базе». Дальше updated_at двигается
только при реальной правке текста.

Прогон:
    python scripts/backfill_entry_dates.py                            # показать план
    DATABASE_URL=... python scripts/backfill_entry_dates.py --apply   # записать
    python scripts/backfill_entry_dates.py --sql | psql "$DATABASE_URL"  # через SQL

Режим --sql нужен для прода: git-истории внутри контейнера нет (Dockerfile
копирует только content/), поэтому даты считаются локально, а на сервер уходит
готовый набор UPDATE в одной транзакции.
"""
import argparse
import asyncio
import os
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENTRIES = REPO / "content" / "entries"


def added_at(path: Path) -> str | None:
    """Дата первого коммита, добавившего файл. Переименования отслеживаем
    через --follow, иначе перенесённая между разделами статья выглядит новой."""
    out = subprocess.run(
        ["git", "log", "--follow", "--diff-filter=A", "--format=%aI", "--", str(path)],
        cwd=REPO, capture_output=True, text=True,
    ).stdout.strip().splitlines()
    return out[-1] if out else None


def emit_sql(rows: list[tuple[str, str]]) -> None:
    """Печатает транзакцию с UPDATE — для прогона на машине без git-истории."""
    print("BEGIN;")
    for slug, when in rows:
        safe = slug.replace("'", "''")
        print(f"UPDATE baza.entries SET updated_at = '{when}'::timestamptz WHERE slug = '{safe}';")
    print("COMMIT;")


async def main(apply: bool) -> None:
    # Импорт внутри функции: режим --sql должен работать там, где asyncpg
    # не установлен (а это ровно та машина, где есть git-история).
    import asyncpg

    rows = []
    for md in sorted(ENTRIES.rglob("*.md")):
        text = md.read_text(encoding="utf-8")
        m = re.search(r"^slug:\s*(\S+)", text, re.M)
        if not m:
            continue
        when = added_at(md)
        if when:
            rows.append((m.group(1), when))

    print(f"Нашёл дату появления для {len(rows)} статей из "
          f"{len(list(ENTRIES.rglob('*.md')))}")
    for slug, when in sorted(rows, key=lambda r: r[1])[-5:]:
        print(f"  самые свежие: {when[:10]}  {slug}")

    if not apply:
        print("\nЭто план. Повтори с --apply, чтобы записать в БД.")
        return

    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        async with conn.transaction():
            updated = 0
            for slug, when in rows:
                res = await conn.execute(
                    "UPDATE baza.entries SET updated_at = $2::timestamptz WHERE slug = $1",
                    slug, when,
                )
                updated += int(res.split()[-1])
        print(f"Обновлено строк: {updated}")
        distinct = await conn.fetchval("SELECT count(DISTINCT updated_at) FROM baza.entries")
        print(f"Различных updated_at стало: {distinct}")
    finally:
        await conn.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="записать в БД (по умолчанию только план)")
    ap.add_argument("--sql", action="store_true", help="напечатать SQL вместо записи")
    args = ap.parse_args()
    if args.sql:
        rows = []
        for md in sorted(ENTRIES.rglob("*.md")):
            text = md.read_text(encoding="utf-8")
            m = re.search(r"^slug:\s*(\S+)", text, re.M)
            when = added_at(md) if m else None
            if m and when:
                rows.append((m.group(1), when))
        emit_sql(rows)
    else:
        asyncio.run(main(args.apply))
