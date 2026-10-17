"""Фидбэк без технического чата должен доходить хотя бы до админов."""
from app.config import settings
from app.routers.feedback import feedback_recipients


def test_tech_chat_wins(monkeypatch):
    monkeypatch.setattr(settings, "tech_chat_id", "-100500")
    monkeypatch.setattr(settings, "admin_tg_ids", "1,2")
    assert feedback_recipients() == ["-100500"]


def test_falls_back_to_admins(monkeypatch):
    monkeypatch.setattr(settings, "tech_chat_id", "")
    monkeypatch.setattr(settings, "admin_tg_ids", "222, 111")
    assert feedback_recipients() == ["111", "222"]


def test_nobody_configured(monkeypatch):
    monkeypatch.setattr(settings, "tech_chat_id", "")
    monkeypatch.setattr(settings, "admin_tg_ids", "")
    assert feedback_recipients() == []
