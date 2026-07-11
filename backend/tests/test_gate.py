"""
Тесты гейта по подписке (backend/app/gate.py) — самая чувствительная часть
продукта (см. BAZA_CONTEXT.md §4). Redis/Postgres/Telegram API мокаются,
никаких реальных сетевых/БД вызовов.
"""
import hashlib
import hmac
import json
import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app import gate

BOT_TOKEN = "test-bot-token"


def make_init_data(tg_id=42, username="tester", auth_date=None, tamper=False):
    auth_date = auth_date if auth_date is not None else int(time.time())
    params = {
        "user": json.dumps({"id": tg_id, "username": username}),
        "auth_date": str(auth_date),
        "query_id": "AAF00000000",
    }
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if tamper:
        computed_hash = "0" * len(computed_hash)
    params["hash"] = computed_hash
    return "&".join(f"{k}={v}" for k, v in params.items())


class TestValidateInitData:
    def test_valid_signature_accepted(self):
        init_data = make_init_data(tg_id=42, username="tester")
        result = gate.validate_init_data(init_data)
        assert result["tg_id"] == 42
        assert result["username"] == "tester"

    def test_missing_hash_rejected(self):
        with pytest.raises(HTTPException) as exc:
            gate.validate_init_data("user=%7B%7D&auth_date=1")
        assert exc.value.status_code == 401

    def test_tampered_signature_rejected(self):
        init_data = make_init_data(tamper=True)
        with pytest.raises(HTTPException) as exc:
            gate.validate_init_data(init_data)
        assert exc.value.status_code == 401

    def test_expired_auth_date_rejected(self):
        stale = int(time.time()) - 3700  # > 1ч
        init_data = make_init_data(auth_date=stale)
        with pytest.raises(HTTPException) as exc:
            gate.validate_init_data(init_data)
        assert exc.value.status_code == 401

    def test_auth_date_just_under_limit_accepted(self):
        fresh = int(time.time()) - 3500  # < 1ч
        init_data = make_init_data(auth_date=fresh)
        result = gate.validate_init_data(init_data)
        assert result["tg_id"] is not None


class TestCheckSubscription:
    @pytest.mark.asyncio
    async def test_redis_cache_hit_subscribed_skips_telegram_api(self):
        fake_redis = AsyncMock()
        fake_redis.get.return_value = "1"
        with patch("app.gate.get_redis", return_value=fake_redis), \
             patch("app.gate._fetch_subscription_status", new=AsyncMock()) as fetch_mock:
            result = await gate.check_subscription(42)
        assert result is True
        fetch_mock.assert_not_called()

    @pytest.mark.asyncio
    async def test_redis_cache_hit_not_subscribed_skips_telegram_api(self):
        fake_redis = AsyncMock()
        fake_redis.get.return_value = "0"
        with patch("app.gate.get_redis", return_value=fake_redis), \
             patch("app.gate._fetch_subscription_status", new=AsyncMock()) as fetch_mock:
            result = await gate.check_subscription(42)
        assert result is False
        fetch_mock.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_miss_fetches_and_caches_with_subscribed_ttl(self):
        fake_redis = AsyncMock()
        fake_redis.get.return_value = None
        fake_pool = AsyncMock()
        with patch("app.gate.get_redis", return_value=fake_redis), \
             patch("app.gate.get_pool", return_value=fake_pool), \
             patch("app.gate._fetch_subscription_status", new=AsyncMock(return_value=True)):
            result = await gate.check_subscription(42)
        assert result is True
        fake_redis.set.assert_called_once()
        _, kwargs = fake_redis.set.call_args
        assert kwargs["ex"] == gate.settings.gate_ttl_subscribed
        fake_pool.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_miss_fetches_and_caches_with_not_subscribed_ttl(self):
        fake_redis = AsyncMock()
        fake_redis.get.return_value = None
        fake_pool = AsyncMock()
        with patch("app.gate.get_redis", return_value=fake_redis), \
             patch("app.gate.get_pool", return_value=fake_pool), \
             patch("app.gate._fetch_subscription_status", new=AsyncMock(return_value=False)):
            result = await gate.check_subscription(42)
        assert result is False
        _, kwargs = fake_redis.set.call_args
        assert kwargs["ex"] == gate.settings.gate_ttl_not_subscribed

    @pytest.mark.asyncio
    async def test_force_bypasses_cache(self):
        fake_redis = AsyncMock()
        fake_pool = AsyncMock()
        with patch("app.gate.get_redis", return_value=fake_redis), \
             patch("app.gate.get_pool", return_value=fake_pool), \
             patch("app.gate._fetch_subscription_status", new=AsyncMock(return_value=True)) as fetch_mock:
            await gate.check_subscription(42, force=True)
        fake_redis.get.assert_not_called()
        fetch_mock.assert_called_once()


class TestFetchSubscriptionStatus:
    @pytest.mark.asyncio
    async def test_member_status_is_subscribed(self):
        for status in ("member", "administrator", "creator"):
            mock_response = AsyncMock()
            mock_response.json = lambda status=status: {"ok": True, "result": {"status": status}}
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            with patch("httpx.AsyncClient", return_value=mock_client):
                result = await gate._fetch_subscription_status(42)
            assert result is True

    @pytest.mark.asyncio
    async def test_left_status_is_not_subscribed(self):
        mock_response = AsyncMock()
        mock_response.json = lambda: {"ok": True, "result": {"status": "left"}}
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await gate._fetch_subscription_status(42)
        assert result is False

    @pytest.mark.asyncio
    async def test_telegram_api_error_degrades_to_pg_fallback(self):
        """API отвечает ok=false (напр. бот не в канале) → деградация на PG, не блокируем."""
        mock_response = AsyncMock()
        mock_response.json = lambda: {"ok": False}
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        fake_pool = AsyncMock()
        fake_pool.fetchrow.return_value = {"is_subscribed": True}
        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("app.gate.get_pool", return_value=fake_pool):
            result = await gate._fetch_subscription_status(42)
        assert result is True  # уже подписанный не блокируется сбоем API

    @pytest.mark.asyncio
    async def test_network_exception_degrades_to_pg_fallback(self):
        mock_client = AsyncMock()
        mock_client.get.side_effect = __import__("httpx").ConnectError("boom")
        mock_client.__aenter__.return_value = mock_client
        fake_pool = AsyncMock()
        fake_pool.fetchrow.return_value = None
        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("app.gate.get_pool", return_value=fake_pool):
            result = await gate._fetch_subscription_status(42)
        assert result is False  # нет записи в PG → не подписан


class TestRateLimitRecheck:
    @pytest.mark.asyncio
    async def test_first_call_sets_key_and_passes(self):
        fake_redis = AsyncMock()
        fake_redis.get.return_value = None
        with patch("app.gate.get_redis", return_value=fake_redis):
            await gate.rate_limit_recheck(42)
        fake_redis.set.assert_called_once_with(
            "baza:recheck_rl:42", "1", ex=gate.settings.gate_recheck_rate_limit_sec
        )

    @pytest.mark.asyncio
    async def test_second_call_within_window_rejected(self):
        fake_redis = AsyncMock()
        fake_redis.get.return_value = "1"
        with patch("app.gate.get_redis", return_value=fake_redis):
            with pytest.raises(HTTPException) as exc:
                await gate.rate_limit_recheck(42)
        assert exc.value.status_code == 429
