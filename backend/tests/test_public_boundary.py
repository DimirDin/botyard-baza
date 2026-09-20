"""Граница «что доступно без подписки».

Витрина до гейта (routers/public.py) — единственное место в API, где нет
require_subscribed. Тест стережёт именно это: чтобы незащищённых ручек
не стало больше, чем одна осознанно добавленная, и чтобы витрина не начала
отдавать что-то кроме явно помеченных статей.

Без БД: проверяются маршруты приложения и текст запросов, а не данные.
"""
import re
from pathlib import Path

import pytest

from app.main import app

PUBLIC_PREFIX = "/api/public"
# Ручки, которым авторизация не нужна по определению.
ALWAYS_OPEN = {"/health", "/api/gate/check", "/api/gate/recheck"}
# Служебное от FastAPI, не наше API.
FASTAPI_INTERNAL = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}


def _api_routes():
    for route in app.routes:
        path = getattr(route, "path", None)
        if not path or path in FASTAPI_INTERNAL:
            continue
        yield route, path


def test_незащищённые_ручки_только_ожидаемые():
    """Любая ручка вне витрины и вне списка открытых обязана требовать подписку."""
    unprotected = []
    for route, path in _api_routes():
        if path in ALWAYS_OPEN or path.startswith(PUBLIC_PREFIX):
            continue
        deps = getattr(route, "dependant", None)
        names = {
            getattr(d.call, "__name__", "")
            for d in (deps.dependencies if deps else [])
        }
        # require_admin сам зависит от require_subscribed, поэтому годится тоже.
        if not ({"require_subscribed", "require_admin"} & names):
            unprotected.append(path)

    assert unprotected == [], (
        "Появились ручки без require_subscribed: " + ", ".join(sorted(set(unprotected)))
    )


def _queries():
    src = Path(__file__).resolve().parents[1] / "app" / "routers" / "public.py"
    text = src.read_text(encoding="utf-8")
    return text, re.findall(r"SELECT.*?(?=\"\"\")", text, re.S)


# «FROM baza.X», перед которым НЕ стоит count(*) — то есть запрос, возвращающий
# строки, а не число. Только такие способны что-то выдать наружу.
_ROW_SOURCE = re.compile(r"(?<!count\(\*\)\s)FROM\s+baza\.(\w+)", re.I)
_COUNT_SOURCE = re.compile(r"count\(\*\)\s+FROM\s+baza\.(\w+)", re.I)


def test_витрина_отдаёт_только_помеченные_статьи():
    """Любой запрос витрины, возвращающий СТРОКИ, обязан фильтровать
    по preview_public И published.

    Агрегаты вида `count(*) FROM baza.tools` под это правило не подпадают:
    они отдают одно число «сколько всего в базе», а не содержимое. Это
    витринная цифра, её показывают до входа.
    """
    _, queries = _queries()
    assert queries, "в витрине не нашлось ни одного SQL-запроса"

    checked = 0
    for query in queries:
        for table in _ROW_SOURCE.findall(query):
            checked += 1
            assert table == "entries", (
                f"витрина возвращает строки из baza.{table} — наружу можно только статьи"
            )
            assert "preview_public" in query, f"запрос витрины без preview_public:\n{query}"
            assert "published" in query, f"запрос витрины без published:\n{query}"

    assert checked >= 2, "ожидались как минимум список витрины и отдельная статья"


def test_из_других_таблиц_витрина_берёт_только_счётчики():
    """Чужие таблицы допустимы исключительно как count(*) — ни одной строки."""
    _, queries = _queries()
    allowed_counted = {"entries", "tools", "prompts"}

    for query in queries:
        for table in _COUNT_SOURCE.findall(query):
            assert table in allowed_counted, f"витрина считает baza.{table}"

    text, _ = _queries()
    lowered = text.lower()
    for table in ("baza.users", "baza.events", "baza.favorites",
                  "baza.cc_components", "baza.cheatsheets", "baza.guide_progress"):
        assert table not in lowered, f"витрина обращается к {table}"


@pytest.mark.parametrize("path", ["/api/public/entries", "/api/public/entries/{slug}"])
def test_ручки_витрины_зарегистрированы(path):
    assert path in {p for _, p in _api_routes()}
