"""
Генератор content/components/cc_components_seed.sql из selection.json + aitmpl_catalog.csv.
stdlib, без зависимостей. Запуск: python3 content/components/make_seed.py

Пайплайн пополнения (см. content/components/README.md):
1. Добавить строку в selection.json: {"type", "category", "name", "ru"} — type/category/name
   должны существовать в aitmpl_catalog.csv (иначе скрипт упадёт с понятной ошибкой).
2. python3 content/components/make_seed.py — перегенерирует cc_components_seed.sql.
3. Закоммитить и прогнать сид на сервере (psql -f cc_components_seed.sql).

Идемпотентность: INSERT ... ON CONFLICT (slug) DO UPDATE, но published НЕ трогается при
повторном прогоне — снятая вручную (published=false) карточка не "воскресает" при переcиде.
"""
import csv
import json
from pathlib import Path

HERE = Path(__file__).parent

TYPE_PREFIX = {
    "agents": "agent",
    "commands": "command",
    "mcps": "mcp",
    "hooks": "hook",
    "settings": "setting",
    "skills": "skill",
    "loops": "loop",
}
TYPE_FLAG = {
    "agents": "--agent",
    "commands": "--command",
    "mcps": "--mcp",
    "hooks": "--hook",
    "settings": "--setting",
    "skills": "--skill",
    "loops": "--loop",
}
TYPE_ORDER = ["agents", "commands", "mcps", "skills", "hooks", "settings", "loops"]

REPO_BASE = "https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components"


def load_catalog() -> dict[tuple[str, str], str]:
    """(type, name) -> path (относительно components/{type}/, как в aitmpl_catalog.csv)"""
    catalog = {}
    with open(HERE / "aitmpl_catalog.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            catalog[(row["type"], row["name"])] = row["path"]
    return catalog


def load_bodies() -> dict:
    """slug -> {url, content, ext}, см. fetch_bodies.py"""
    path = HERE / "bodies_cache.json"
    return json.load(open(path, encoding="utf-8")) if path.exists() else {}


def make_body_md(slug: str, install_cmd: str, doc_url: str, bodies: dict) -> str:
    cached = bodies.get(slug)
    lines = [
        "### 💻 Как установить",
        "```bash",
        install_cmd,
        "```",
        "",
        "### 📄 Содержимое",
    ]
    if cached:
        content = cached["content"].strip()
        if cached["ext"] == "json":
            lines += ["```json", content, "```"]
        else:
            lines += [content]
    else:
        lines += ["_не удалось скачать содержимое с GitHub — см. ссылку на первоисточник ниже_"]
    lines += [
        "",
        "### 🔗 Первоисточник",
        f"[{slug}]({doc_url}) · aitmpl.com · MIT",
    ]
    return "\n".join(lines)


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main():
    catalog = load_catalog()
    bodies = load_bodies()
    items = json.load(open(HERE / "selection.json"))["items"]

    # sort_order: по типу (в порядке TYPE_ORDER), внутри типа — по имени
    items_by_type: dict[str, list[dict]] = {}
    for it in items:
        items_by_type.setdefault(it["type"], []).append(it)

    rows = []
    for type_idx, t in enumerate(TYPE_ORDER):
        for name_idx, it in enumerate(sorted(items_by_type.get(t, []), key=lambda x: x["name"])):
            key = (t, it["name"])
            if key not in catalog:
                raise SystemExit(f"'{it['name']}' (type={t}) не найден в aitmpl_catalog.csv — проверь имя")
            path = catalog[key]  # "category/name.ext"
            comp_path = path.rsplit(".", 1)[0]  # без расширения — то, что идёт в npx-команду
            slug = f"aitmpl-{TYPE_PREFIX[t]}-{it['name']}"
            install_cmd = f"npx claude-code-templates@latest {TYPE_FLAG[t]} {comp_path} --yes"
            doc_url = f"{REPO_BASE}/{t}/{path}"
            sort_order = type_idx * 1000 + name_idx
            rows.append({
                "slug": slug,
                "comp_type": t,
                "category": it.get("category", ""),
                "name": it["name"],
                "title": it["name"],
                "summary": it["ru"],
                "install_cmd": install_cmd,
                "doc_url": doc_url,
                "sort_order": sort_order,
                "body_md": make_body_md(slug, install_cmd, doc_url, bodies),
            })

    lines = [
        "-- Автосгенерировано content/components/make_seed.py из selection.json + aitmpl_catalog.csv.",
        "-- НЕ редактировать руками — правь selection.json и перегенерируй.",
        "-- Идемпотентно: ON CONFLICT (slug) DO UPDATE, published не трогается при повторном прогоне.",
        "-- Применить: psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f content/components/cc_components_seed.sql",
        "",
        "BEGIN;",
        "",
    ]
    for r in rows:
        lines.append(
            "INSERT INTO baza.cc_components "
            "(slug, comp_type, category, name, title, summary, install_cmd, doc_url, sort_order, body_md) VALUES ("
            f"{sql_str(r['slug'])}, {sql_str(r['comp_type'])}, {sql_str(r['category'])}, "
            f"{sql_str(r['name'])}, {sql_str(r['title'])}, {sql_str(r['summary'])}, "
            f"{sql_str(r['install_cmd'])}, {sql_str(r['doc_url'])}, {r['sort_order']}, {sql_str(r['body_md'])})\n"
            "ON CONFLICT (slug) DO UPDATE SET "
            "comp_type = EXCLUDED.comp_type, category = EXCLUDED.category, name = EXCLUDED.name, "
            "title = EXCLUDED.title, summary = EXCLUDED.summary, install_cmd = EXCLUDED.install_cmd, "
            "doc_url = EXCLUDED.doc_url, sort_order = EXCLUDED.sort_order, body_md = EXCLUDED.body_md, "
            "updated_at = now();"
        )
    lines.append("")
    lines.append("COMMIT;")

    out = HERE / "cc_components_seed.sql"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Сгенерировано {len(rows)} строк -> {out}")
    by_type = {}
    for r in rows:
        by_type[r["comp_type"]] = by_type.get(r["comp_type"], 0) + 1
    for t in TYPE_ORDER:
        print(f"  {t}: {by_type.get(t, 0)}")


if __name__ == "__main__":
    main()
