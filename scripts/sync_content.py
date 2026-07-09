"""
Синк content/ → PostgreSQL. Idempotent: повторный запуск обновляет существующие записи по slug/repo.
Запуск: DATABASE_URL=postgresql://... python scripts/sync_content.py

CI-шаг: любой merge в main с изменениями в content/ должен вызывать этот скрипт (§7).
Удаление записи из файла не обрабатывается автоматически — помечай published: false вручную.
"""
import asyncio
import os
import sys
from pathlib import Path

import asyncpg
import yaml

CONTENT_DIR = Path(__file__).parent.parent / "content"
DATABASE_URL = os.environ["DATABASE_URL"]


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        raise ValueError("Файл без YAML frontmatter")
    _, fm, body = text.split("---", 2)
    meta = yaml.safe_load(fm)
    return meta, body.strip()


async def sync_entries(conn: asyncpg.Connection) -> int:
    count = 0
    for md_file in CONTENT_DIR.glob("entries/*/*.md"):
        meta, body = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        await conn.execute(
            """
            INSERT INTO baza.entries (slug, section, group_slug, title, summary, body_md, doc_url, tags, sort_order, published, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
            ON CONFLICT (slug) DO UPDATE SET
                section = $2, group_slug = $3, title = $4, summary = $5, body_md = $6,
                doc_url = $7, tags = $8, sort_order = $9, published = $10, updated_at = now()
            """,
            meta["slug"], meta["section"], meta.get("group"), meta["title"], meta.get("summary"),
            body, meta.get("doc_url"), meta.get("tags", []), meta.get("sort_order", 100),
            meta.get("published", True),
        )
        count += 1
    return count


async def sync_tools(conn: asyncpg.Connection) -> int:
    tools = yaml.safe_load((CONTENT_DIR / "tools.yaml").read_text(encoding="utf-8")) or []
    count = 0
    for t in tools:
        await conn.execute(
            """
            INSERT INTO baza.tools (repo, name, category, description_ru, body_md, badge, verify_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (repo) DO UPDATE SET
                category = $3, description_ru = $4, body_md = $5, badge = $6, verify_status = $7
            """,
            t["repo"], t["repo"].split("/")[-1], t["category"],
            t["description_ru"], t.get("body_md"), t.get("badge"), t.get("verify_status", "check"),
        )
        count += 1
    print("⚠️  tools залиты с published=false — включи вручную после github-синка звёзд/проверки 404")
    return count


async def sync_prompts(conn: asyncpg.Connection) -> int:
    prompts = yaml.safe_load((CONTENT_DIR / "prompts.yaml").read_text(encoding="utf-8")) or []
    count = 0
    for p in prompts:
        await conn.execute(
            """
            INSERT INTO baza.prompts (slug, category, title, body, comment)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (slug) DO UPDATE SET
                category = $2, title = $3, body = $4, comment = $5
            """,
            p["slug"], p["category"], p["title"], p["body"], p.get("comment"),
        )
        count += 1
    return count


async def sync_guide(conn: asyncpg.Connection) -> int:
    count = 0
    for md_file in CONTENT_DIR.glob("guide/*/*.md"):
        meta, body = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        await conn.execute(
            """
            INSERT INTO baza.guide_lessons (slug, level, title, summary, body_md, doc_url, order_in_level, published, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
            ON CONFLICT (slug) DO UPDATE SET
                level = $2, title = $3, summary = $4, body_md = $5,
                doc_url = $6, order_in_level = $7, published = $8, updated_at = now()
            """,
            meta["slug"], meta["level"], meta["title"], meta.get("summary"),
            body, meta.get("doc_url"), meta["order_in_level"], meta.get("published", True),
        )
        count += 1
    return count


async def sync_cheatsheets(conn: asyncpg.Connection) -> int:
    count = 0
    for md_file in CONTENT_DIR.glob("cheatsheets/*.md"):
        meta, body = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        await conn.execute(
            """
            INSERT INTO baza.cheatsheets (slug, title, category, body_md, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (slug) DO UPDATE SET
                title = $2, category = $3, body_md = $4, sort_order = $5
            """,
            meta["slug"], meta["title"], meta["category"], body, meta.get("sort_order", 100),
        )
        count += 1
    return count


async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        e = await sync_entries(conn)
        t = await sync_tools(conn)
        p = await sync_prompts(conn)
        c = await sync_cheatsheets(conn)
        g = await sync_guide(conn)
        print(f"Синк готов: entries={e} tools={t} prompts={p} cheatsheets={c} guide={g}")
    finally:
        await conn.close()


if __name__ == "__main__":
    if "DATABASE_URL" not in os.environ:
        print("Задай DATABASE_URL перед запуском", file=sys.stderr)
        sys.exit(1)
    asyncio.run(main())
