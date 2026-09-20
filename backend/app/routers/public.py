"""Единственный роутер без require_subscribed — витрина до гейта.

Граница проходит ровно здесь, поэтому она вынесена в отдельный файл: всё
остальное API защищено зависимостью, и случайно добавить публичную ручку
в защищённый роутер теперь нельзя, не заметив этого.

Что отсюда можно достать: только статьи, у которых в БД одновременно
published = true И preview_public = true. Флаг ставится единственным способом —
`preview: true` во frontmatter файла в content/entries/, значение по умолчанию
false (миграция 0011). Ни списка всего каталога, ни инструментов, ни промптов,
ни поиска здесь нет и быть не должно.

Зачем это вообще. Гейт показывал неподписанному три числа и кнопку, то есть
просил подписку авансом, за кота в мешке. Хуже того, deep link из поста канала
(entry_{slug}) вёл на ту же заглушку: человек шёл за конкретной статьёй
и не видел её. Теперь он читает именно то, за чем пришёл, и решает осознанно.
"""
import logging

from fastapi import APIRouter, HTTPException, Request

from app.db import get_pool, get_redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public", tags=["public"])

# Ручка не требует авторизации, поэтому её единственная защита от перебора —
# лимит на IP. Числа щадящие: живой человек читает одну-две статьи до подписки,
# 30 запросов в минуту он не наберёт, а скрипту, качающему каталог, это мешает.
RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW_SEC = 60


async def _rate_limit(request: Request) -> None:
    """Скользящее окно на IP. Сбой Redis не должен закрывать витрину —
    логируем и пропускаем: это не гейт, утечки тут нет, а отказ в показе
    статьи стоит конверсии."""
    ip = (request.client.host if request.client else None) or "unknown"
    key = f"baza:publicrl:{ip}"
    try:
        r = get_redis()
        hits = await r.incr(key)
        if hits == 1:
            await r.expire(key, RATE_LIMIT_WINDOW_SEC)
        if hits > RATE_LIMIT_REQUESTS:
            raise HTTPException(429, "Слишком много запросов, попробуйте через минуту")
    except HTTPException:
        raise
    except Exception:
        logger.warning("rate limit витрины недоступен, пропускаю запрос", exc_info=True)


@router.get("/counts")
async def public_counts(request: Request):
    """Размер базы для экрана гейта.

    Раньше эти числа брались из /api/home, который требует подписку, а рисуются
    они только НЕподписанному — то есть на гейте всегда стояли многоточия.
    Публичными они и так были по смыслу: это витринная цифра «сколько тут всего»,
    её показывают до входа, а не после.
    """
    await _rate_limit(request)
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT
            (SELECT count(*) FROM baza.entries WHERE published) AS entries_count,
            (SELECT count(*) FROM baza.tools WHERE published) AS tools_count,
            (SELECT count(*) FROM baza.prompts WHERE published) AS prompts_count
        """
    )
    return dict(row)


@router.get("/entries")
async def public_entries(request: Request):
    """Список статей-витрин. Нужен фронту, чтобы показать запасную статью,
    когда deep link пустой или ведёт на непомеченную статью."""
    await _rate_limit(request)
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT slug, title, summary, section, group_slug
        FROM baza.entries
        WHERE published AND preview_public
        ORDER BY sort_order, id
        """
    )
    return {"entries": [dict(r) for r in rows]}


@router.get("/entries/{slug}")
async def public_entry(slug: str, request: Request):
    """Одна статья целиком — но только помеченная.

    Непомеченная статья отдаёт 404, а не 403: неподписанному не сообщается,
    существует ли такой slug вообще. Иначе ручка превратилась бы в способ
    проверять наличие статей в закрытом каталоге."""
    await _rate_limit(request)
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT slug, title, summary, body_md, doc_url, section, group_slug, updated_at
        FROM baza.entries
        WHERE slug = $1 AND published AND preview_public
        """,
        slug,
    )
    if not row:
        raise HTTPException(404, "Статья не найдена")
    return dict(row)
