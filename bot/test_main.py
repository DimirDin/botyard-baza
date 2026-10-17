"""Чистая логика бота: разбор deep link и выбор получателей фидбэка.

Запуск: cd bot && python -m pytest -q (нужны aiogram и pytest)."""
import pytest
from aiogram.utils.deep_linking import encode_payload

from main import DEEP_LINK_EXACT, app_url, feedback_recipients, parse_start_payload


@pytest.mark.parametrize("text,expected", [
    ("/start entry_api-migrate-to-55", "entry_api-migrate-to-55"),
    ("/start tool_42", "tool_42"),
    ("/start prompt_code-review", "prompt_code-review"),
    ("/start section_base", "section_base"),
    ("/start src_vcru", "src_vcru"),
    # До 17.10.2026 эти три выбрасывались, и ссылка вела на главную
    ("/start guide_guide-model-upgrade", "guide_guide-model-upgrade"),
    ("/start calc", "calc"),
    ("/start search", "search"),
])
def test_known_payloads_pass_through(text, expected):
    assert parse_start_payload(text) == expected


@pytest.mark.parametrize("text", ["/start", "/start   ", "/start hello", "/start calculator", None])
def test_unknown_or_missing_payload_is_dropped(text):
    assert parse_start_payload(text) is None


def test_base64_payload_is_decoded():
    assert parse_start_payload(f"/start {encode_payload('entry_cc-mods')}") == "entry_cc-mods"


def test_every_exact_payload_is_parseable():
    """Каждая точная форма должна доходить до Mini App без изменений."""
    for p in DEEP_LINK_EXACT:
        assert parse_start_payload(f"/start {p}") == p


def test_app_url():
    assert app_url().endswith("baza.botyard.site")
    assert app_url("calc").endswith("?startapp=calc")


def test_recipients_prefer_tech_chat():
    assert feedback_recipients("-100123", "1,2") == ["-100123"]


def test_recipients_fall_back_to_admins():
    assert feedback_recipients("", "111, 222,abc,") == ["111", "222"]


def test_no_recipients():
    assert feedback_recipients("", "") == []


def test_bot_accepts_every_deep_link_type_the_frontend_handles():
    """resolveStartParam во фронте и списки бота — два источника правды.
    Новый тип deep link, заведённый только во фронте, бот молча выбрасывает."""
    import re
    from pathlib import Path

    from main import DEEP_LINK_PREFIXES

    app = Path(__file__).parent.parent / "frontend" / "src" / "App.jsx"
    src = app.read_text(encoding="utf-8")
    body = src[src.index("function resolveStartParam"):]
    body = body[:body.index("\n}\n")]
    types = set(re.findall(r'type === "(\w+)"', body))
    assert types, "не удалось разобрать resolveStartParam"
    for t in types:
        assert t in DEEP_LINK_EXACT or f"{t}_" in DEEP_LINK_PREFIXES, f"бот не пропускает deep link «{t}»"
