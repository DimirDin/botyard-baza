"""
Скачивает реальное содержимое (промпт агента / конфиг хука-mcp-настройки / SKILL.md) для всех
компонентов из selection.json с GitHub (raw.githubusercontent.com), кэширует в bodies_cache.json.
stdlib, без зависимостей. Запуск: python3 content/components/fetch_bodies.py

Идемпотентно по кэшу: уже скачанные slug не перезапрашиваются (см. --force). Без токена — лимит
GitHub raw (не API) практически не ограничен для публичных файлов, но при частых ошибках
подключения используй паузы/повторные запуски.
"""
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
RAW_BASE = "https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components"

TYPE_PREFIX = {
    "agents": "agent", "commands": "command", "mcps": "mcp",
    "hooks": "hook", "settings": "setting", "skills": "skill", "loops": "loop",
}


def load_catalog() -> dict[tuple[str, str], str]:
    catalog = {}
    with open(HERE / "aitmpl_catalog.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            catalog[(row["type"], row["name"])] = row["path"]
    return catalog


def raw_url(comp_type: str, path: str) -> str:
    # skills в каталоге — путь без расширения (это папка), реальный файл — SKILL.md внутри
    if comp_type == "skills":
        return f"{RAW_BASE}/{comp_type}/{path}/SKILL.md"
    return f"{RAW_BASE}/{comp_type}/{path}"


def fetch(url: str) -> str | None:
    req = urllib.request.Request(url, headers={"User-Agent": "botyard-baza-fetch-bodies"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def main():
    force = "--force" in sys.argv
    catalog = load_catalog()
    items = json.load(open(HERE / "selection.json"))["items"]

    cache_path = HERE / "bodies_cache.json"
    cache = json.load(open(cache_path)) if cache_path.exists() and not force else {}

    ok = skip = fail = 0
    for it in items:
        slug = f"aitmpl-{TYPE_PREFIX[it['type']]}-{it['name']}"
        if slug in cache and not force:
            skip += 1
            continue
        key = (it["type"], it["name"])
        path = catalog.get(key)
        if not path:
            print(f"✗ {slug}: не найден в каталоге")
            fail += 1
            continue
        url = raw_url(it["type"], path)
        content = fetch(url)
        if content is None:
            print(f"✗ 404: {slug} ({url})")
            fail += 1
            continue
        cache[slug] = {"url": url, "content": content, "ext": path.rsplit(".", 1)[-1] if "." in path.rsplit("/", 1)[-1] else "md"}
        ok += 1
        print(f"✓ {slug} ({len(content)} байт)")
        time.sleep(0.1)

    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nСкачано: {ok}, пропущено (уже в кэше): {skip}, ошибок: {fail}. Кэш -> {cache_path}")


if __name__ == "__main__":
    main()
