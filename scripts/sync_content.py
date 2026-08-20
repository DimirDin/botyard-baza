"""
Синк content/ → PostgreSQL. Idempotent: повторный запуск обновляет существующие записи по slug/repo.
Запуск: DATABASE_URL=postgresql://... python scripts/sync_content.py [--prune] [--expect-hash SHA]

CI-шаг: любой merge в main с изменениями в content/ должен вызывать этот скрипт (§7).

--prune       удаляет из БД записи, которых больше нет в content/. Без него удалённая
              из файлов строка живёт в проде вечно (так осиротели supabase-mcp и др.).
--expect-hash сверяет отпечаток content/ с ожидаемым и падает при расхождении.
              Защита от тихого синка: backend/Dockerfile делает `COPY content ./content`,
              то есть контент ВШИТ В ОБРАЗ. Запуск синка внутри контейнера без
              пересборки образа заливает СТАРЫЙ контент и рапортует «Синк готов».
              Отпечаток печатается всегда — сверяй его с локальным `--print-hash`.
"""
import argparse
import asyncio
import hashlib
import os
import sys
from pathlib import Path

import asyncpg
import yaml

sys.path.insert(0, str(Path(__file__).parent))
from menu_registry import valid_pairs  # noqa: E402

CONTENT_DIR = Path(__file__).parent.parent / "content"


def content_fingerprint() -> str:
    """Детерминированный sha256 по всем файлам content/ — работает и без git."""
    h = hashlib.sha256()
    for f in sorted(CONTENT_DIR.rglob("*")):
        if f.is_file() and not f.name.startswith("."):
            h.update(str(f.relative_to(CONTENT_DIR)).encode())
            h.update(f.read_bytes())
    return h.hexdigest()[:16]


class ValidationError(Exception):
    """Категория, которой нет в menu.js → контент недостижим в навигации."""


def check_category(pairs: set[str], category: str, what: str, errors: list[str]) -> None:
    if category not in pairs:
        errors.append(f"  {what}: категория '{category}' отсутствует в menu.js")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        raise ValueError("Файл без YAML frontmatter")
    _, fm, body = text.split("---", 2)
    meta = yaml.safe_load(fm)
    return meta, body.strip()


async def sync_entries(conn: asyncpg.Connection, seen: set[str], errors: list[str]) -> int:
    pairs = valid_pairs("BASE_MENU")
    count = 0
    for md_file in CONTENT_DIR.glob("entries/*/*.md"):
        meta, body = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        section = meta.get("section") or (meta.get("category", "").split("/")[0] if "category" in meta else md_file.parent.name)
        group = meta.get("group") or (meta.get("category", "").split("/")[1] if "category" in meta and "/" in meta["category"] else None)
        check_category(pairs, f"{section}/{group}", f"статья {md_file.name}", errors)
        seen.add(meta["slug"])
        await conn.execute(
            """
            INSERT INTO baza.entries (slug, section, group_slug, title, summary, body_md, doc_url, tags, sort_order, published, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
            ON CONFLICT (slug) DO UPDATE SET
                section = $2, group_slug = $3, title = $4, summary = $5, body_md = $6,
                doc_url = $7, tags = $8, sort_order = $9, published = $10, updated_at = now()
            """,
            meta["slug"], section, group, meta["title"], meta.get("summary"),
            body, meta.get("doc_url"), meta.get("tags", []), meta.get("sort_order", 100),
            meta.get("published", True),
        )
        count += 1
    return count


async def sync_tools(conn: asyncpg.Connection, seen: set[str], errors: list[str]) -> int:
    pairs = valid_pairs("TOOLS_MENU")
    tools = yaml.safe_load((CONTENT_DIR / "tools.yaml").read_text(encoding="utf-8")) or []
    count = 0
    for t in tools:
        check_category(pairs, t["category"], f"инструмент {t['repo']}", errors)
        seen.add(t["repo"])
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


async def sync_prompts(conn: asyncpg.Connection, seen: set[str], errors: list[str]) -> int:
    pairs = valid_pairs("PROMPTS_MENU")
    prompts = yaml.safe_load((CONTENT_DIR / "prompts.yaml").read_text(encoding="utf-8")) or []
    count = 0
    for p in prompts:
        check_category(pairs, p["category"], f"промпт {p['slug']}", errors)
        seen.add(p["slug"])
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


async def sync_guide(conn: asyncpg.Connection, seen: set[str]) -> int:
    count = 0
    for md_file in CONTENT_DIR.glob("guide/*/*.md"):
        meta, body = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        seen.add(meta["slug"])
        await conn.execute(
            """
            INSERT INTO baza.guide_lessons (slug, level, title, summary, body_md, doc_url, order_in_level, related_entry, related_tools, related_prompts, published, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
            ON CONFLICT (slug) DO UPDATE SET
                level = $2, title = $3, summary = $4, body_md = $5,
                doc_url = $6, order_in_level = $7, related_entry = $8,
                related_tools = $9, related_prompts = $10, published = $11, updated_at = now()
            """,
            meta["slug"], meta["level"], meta["title"], meta.get("summary"),
            body, meta.get("doc_url"), meta["order_in_level"], meta.get("related_entry"),
            meta.get("related_tools", []), meta.get("related_prompts", []), meta.get("published", True),
        )
        count += 1
    return count


async def sync_cheatsheets(conn: asyncpg.Connection, seen: set[str]) -> int:
    count = 0
    for md_file in CONTENT_DIR.glob("cheatsheets/*.md"):
        meta, body = parse_frontmatter(md_file.read_text(encoding="utf-8"))
        seen.add(meta["slug"])
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


async def prune(conn: asyncpg.Connection, table: str, key: str, seen: set[str], dry: bool) -> int:
    """Удаляет строки, которых больше нет в content/. Без этого они живут в проде вечно."""
    rows = await conn.fetch(f"SELECT {key} FROM baza.{table}")
    orphans = [r[key] for r in rows if r[key] not in seen]
    if not orphans:
        return 0
    verb = "будут удалены" if dry else "удалены"
    print(f"  {table}: {len(orphans)} осиротевших строк {verb}:")
    for o in sorted(orphans):
        print(f"    - {o}")
    if not dry:
        await conn.execute(f"DELETE FROM baza.{table} WHERE {key} = ANY($1::text[])", orphans)
    return len(orphans)


async def main(args):
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        errors: list[str] = []
        s_entries, s_tools, s_prompts, s_cheats, s_guide = set(), set(), set(), set(), set()

        e = await sync_entries(conn, s_entries, errors)
        t = await sync_tools(conn, s_tools, errors)
        p = await sync_prompts(conn, s_prompts, errors)
        c = await sync_cheatsheets(conn, s_cheats)
        g = await sync_guide(conn, s_guide)

        if errors:
            raise ValidationError(
                "Категории вне menu.js — такой контент попадёт в БД, но будет "
                "недостижим в навигации:\n" + "\n".join(errors)
            )

        print(f"Синк готов: entries={e} tools={t} prompts={p} cheatsheets={c} guide={g}")

        print("Проверка осиротевших строк:")
        removed = 0
        removed += await prune(conn, "entries", "slug", s_entries, not args.prune)
        removed += await prune(conn, "tools", "repo", s_tools, not args.prune)
        removed += await prune(conn, "prompts", "slug", s_prompts, not args.prune)
        removed += await prune(conn, "cheatsheets", "slug", s_cheats, not args.prune)
        removed += await prune(conn, "guide_lessons", "slug", s_guide, not args.prune)
        if removed == 0:
            print("  чисто")
        elif not args.prune:
            print("  ↑ перезапусти с --prune, чтобы удалить")
    finally:
        await conn.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--prune", action="store_true", help="удалить из БД записи, которых нет в content/")
    ap.add_argument("--expect-hash", help="упасть, если отпечаток content/ не совпадает")
    ap.add_argument("--print-hash", action="store_true", help="напечатать отпечаток content/ и выйти")
    args = ap.parse_args()

    fingerprint = content_fingerprint()
    if args.print_hash:
        print(fingerprint)
        sys.exit(0)

    print(f"Отпечаток content/: {fingerprint}")
    if args.expect_hash and args.expect_hash != fingerprint:
        print(
            f"ОТПЕЧАТОК НЕ СОВПАЛ: ожидался {args.expect_hash}, в образе {fingerprint}.\n"
            "Контент вшит в Docker-образ — пересобери его (`docker compose up -d --build`) "
            "перед синком, иначе зальётся старый контент.",
            file=sys.stderr,
        )
        sys.exit(2)

    if "DATABASE_URL" not in os.environ:
        print("Задай DATABASE_URL перед запуском", file=sys.stderr)
        sys.exit(1)
    try:
        asyncio.run(main(args))
    except ValidationError as exc:
        print(f"\nВАЛИДАЦИЯ НЕ ПРОШЛА\n{exc}", file=sys.stderr)
        sys.exit(3)
