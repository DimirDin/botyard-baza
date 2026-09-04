"""
Проверка ссылок контента — ловит битые doc_url и отсутствующие картинки
ДО заливки в БД, а не через полгода вручную.

Повод: 04.09.2026 прогнали все 96 уникальных doc_url по 185 статьям и нашли одну
мёртвую (`docs.anthropic.com/.../use-cases/rag`, 404). Она лежала в проде месяцами,
потому что автоматической проверки не было вообще. Заодно выяснилось, что
формулировка «doc_url в 68 статьях указывает на переехавшие домены» вводила
в заблуждение: переехавшие домены отдают редирект и доезжают до живой страницы —
для пользователя они рабочие. Битой была ровно одна.

Две независимые проверки:

  1. Локальные ассеты (офлайн, быстро) — `![](/entry-images/foo.jpg)` должен
     существовать в frontend/public. Эта же проверка встроена в sync_content.py,
     потому что она детерминированная и не зависит от сети.

  2. doc_url (сеть) — HTTP-код с переходом по редиректам. Держится отдельно от
     синка намеренно: 100+ сетевых запросов сделали бы деплой медленным и
     зависимым от доступности внешних сайтов. Гонять перед партией контента.

Запуск:
    python scripts/check_links.py              # всё
    python scripts/check_links.py --offline    # только ассеты, без сети
    python scripts/check_links.py --timeout 30

Код выхода 1, если что-то битое.
Зависимостей нет кроме PyYAML — работает в голом python:3.12-slim.
"""
import argparse
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import yaml

ROOT = Path(__file__).parent.parent
CONTENT_DIR = ROOT / "content"
PUBLIC_DIR = ROOT / "frontend" / "public"

# ![alt](/entry-images/foo.jpg) — интересуют только абсолютные локальные пути.
# Внешние картинки (https://...) уходят в сетевую проверку вместе с doc_url.
ASSET_RE = re.compile(r"!\[[^\]]*\]\((/[^)\s]+)\)")

# Некоторым хостам HEAD не нравится — сразу ходим GET, но читаем только заголовки.
UA = "Mozilla/5.0 (compatible; baza-linkcheck/1.0; +https://baza.botyard.site)"


def markdown_files() -> list[Path]:
    return sorted(
        [*CONTENT_DIR.glob("entries/*/*.md"), *CONTENT_DIR.glob("cheatsheets/*.md"), *CONTENT_DIR.glob("guide/*/*.md")]
    )


def collect_assets() -> dict[str, list[str]]:
    """{путь_ассета: [файлы, где встречается]}"""
    found: dict[str, list[str]] = {}
    for f in markdown_files():
        for path in ASSET_RE.findall(f.read_text(encoding="utf-8")):
            found.setdefault(path, []).append(str(f.relative_to(ROOT)))
    return found


def collect_doc_urls() -> tuple[dict[str, list[str]], list[str]]:
    """({url: [файлы]}, [жалобы на кривой frontmatter])

    Frontmatter разбираем YAML-ом, а не регуляркой: регулярка на сломанной строке
    просто не находит совпадение и файл молча выпадает из проверки — то есть опечатка
    в doc_url маскировалась бы под «ссылки нет». Ровно на это напоролись при первом
    прогоне этого же скрипта."""
    found: dict[str, list[str]] = {}
    broken: list[str] = []
    for f in markdown_files():
        rel = str(f.relative_to(ROOT))
        text = f.read_text(encoding="utf-8")
        if not text.startswith("---"):
            broken.append(f"  БЕЗ FRONTMATTER  {rel}")
            continue
        try:
            meta = yaml.safe_load(text.split("---", 2)[1]) or {}
        except yaml.YAMLError as e:
            broken.append(f"  НЕВАЛИДНЫЙ YAML  {rel}: {str(e).splitlines()[0]}")
            continue
        url = meta.get("doc_url")
        if url is None:
            continue  # doc_url необязателен
        if not isinstance(url, str) or not url.startswith("http"):
            broken.append(f"  doc_url НЕ URL  {rel}: {url!r}")
            continue
        found.setdefault(url, []).append(rel)
    # инструменты хранят ссылку неявно — через repo, их проверяет sync_github_stars.py
    return found, broken


def check_assets(assets: dict[str, list[str]]) -> list[str]:
    problems = []
    for path, users in sorted(assets.items()):
        if not (PUBLIC_DIR / path.lstrip("/")).exists():
            problems.append(f"  НЕТ ФАЙЛА  {path}\n             ← {', '.join(users)}")
    return problems


def http_status(url: str, timeout: int) -> int | str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:  # таймаут, DNS, TLS — всё это «проверить руками»
        return type(e).__name__


def check_doc_urls(urls: dict[str, list[str]], timeout: int, workers: int) -> list[str]:
    problems = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(lambda u: (u, http_status(u, timeout)), urls))
    for url, status in sorted(results, key=lambda x: str(x[1])):
        if status != 200:
            problems.append(f"  {status}  {url}\n        ← {', '.join(urls[url])}")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true", help="только локальные ассеты, без сетевых запросов")
    ap.add_argument("--timeout", type=int, default=25)
    ap.add_argument("--workers", type=int, default=12)
    args = ap.parse_args()

    assets = collect_assets()
    asset_problems = check_assets(assets)
    print(f"Локальные картинки: {len(assets)} уникальных путей, битых {len(asset_problems)}")
    for p in asset_problems:
        print(p)

    url_problems: list[str] = []
    if args.offline:
        print("doc_url: пропущено (--offline)")
    else:
        urls, malformed = collect_doc_urls()
        for p in malformed:
            print(p)
        print(f"doc_url: проверяю {len(urls)} уникальных ссылок…")
        url_problems = malformed + check_doc_urls(urls, args.timeout, args.workers)
        print(f"doc_url: битых {len(url_problems)} из {len(urls) + len(malformed)}")
        for p in url_problems[len(malformed):]:
            print(p)

    if asset_problems or url_problems:
        print("\nЕСТЬ БИТЫЕ ССЫЛКИ — чинить до заливки контента.")
        return 1
    print("\nВсё на месте.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
