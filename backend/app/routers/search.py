import hashlib
import logging

from fastapi import APIRouter, Depends

from app.db import get_pool, get_redis
from app.deps import require_subscribed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"], dependencies=[Depends(require_subscribed)])

# Запросы короче этого не логируем: фронт дебаунсит, но при наборе всё равно успевает
# улететь пара префиксов («ме», «мен»), и они забивают выборку мусором.
MIN_LOGGED_QUERY_LEN = 3

# Один и тот же запрос от одного пользователя пишем не чаще раза в 5 минут — иначе
# набор «managed» → «managed a» → «managed agents» даёт три строки об одной потребности.
SEARCH_LOG_DEDUP_TTL = 300


async def _log_search(tg_id: int, q: str, counts: dict[str, int]) -> None:
    """Пишет запрос в baza.events. Никогда не роняет сам поиск — телеметрия не должна
    стоить пользователю ответа.

    Смысл: запросы с total = 0 — это готовый контент-план, написанный пользователями.
    Раньше поиск не логировался вообще, и самый дешёвый сигнал о пробелах терялся."""
    if len(q) < MIN_LOGGED_QUERY_LEN:
        return
    try:
        r = get_redis()
        digest = hashlib.sha256(q.lower().encode()).hexdigest()[:16]
        dedup_key = f"baza:searchlog:{tg_id}:{digest}"
        # set(nx=True) — атомарно: пишем событие только если ключа ещё не было
        if not await r.set(dedup_key, "1", ex=SEARCH_LOG_DEDUP_TTL, nx=True):
            return

        pool = get_pool()
        await pool.execute(
            "INSERT INTO baza.events (tg_id, event, payload) VALUES ($1, $2, $3)",
            tg_id,
            "search_query",
            {"q": q.lower()[:200], **counts, "total": sum(counts.values())},
        )
    except Exception:
        logger.warning("не удалось залогировать поисковый запрос", exc_info=True)


@router.get("")
async def search(q: str, user: dict = Depends(require_subscribed)):
    """Гибридный поиск: полнотекстовый (морфология, ранжирование, тело статьи)
    ИЛИ подстрока по trgm.

    Почему именно гибрид, а не чистый FTS. Русский snowball-стеммер плохо переваривает
    заимствования, из которых состоит весь словарь этой базы. Проверено на живой БД:

        промпт/промпты/промптов → 'промпт'   ✔ склейка верная
        хук/хуки/хуков          → 'хук'      ✔
        агент/агенты/агентов    → 'агент'    ✔
        токен/токены            → 'ток'      ✗ а «токенами» → 'токен'
        эвал                    → 'эва'      ✗ а «эвалы»    → 'эвал'

    То есть «токен» и «токенами» попадают в РАЗНЫЕ лексемы, а «токен» вдобавок
    сливается с «током». Для раздела про токенизацию и калькулятор токенов это
    неприемлемо, поэтому ILIKE-ветка — не подстраховка, а обязательная часть:
    она ловит и это, и набор по префиксу.

    Ранжирование — только по ts_rank (веса A/B/C заданы в миграции 0010: заголовок
    важнее тела). У строк, найденных лишь подстрокой, ранг 0 — они уходят вниз,
    что и требуется.

    Заметка про объём: ILIKE по body_md идёт без индекса (trgm-индексы покрывают
    только title/summary). На нынешних 197/373/477 строках это доли миллисекунды;
    если каталог вырастет на порядок — заводить trgm-индекс по body_md.
    """
    q = (q or "").strip()
    if not q:
        return {"entries": [], "tools": [], "prompts": [], "guide": [], "components": []}

    pool = get_pool()
    like = f"%{q}%"

    entries = await pool.fetch(
        """
        SELECT slug, title, summary
        FROM baza.entries, websearch_to_tsquery('russian', $1) AS tsq
        WHERE published
          AND (search_tsv @@ tsq OR title ILIKE $2 OR summary ILIKE $2 OR body_md ILIKE $2)
        ORDER BY ts_rank(search_tsv, tsq) DESC, sort_order, id
        LIMIT 10
        """,
        q,
        like,
    )
    tools = await pool.fetch(
        """
        SELECT repo, name, description_ru
        FROM baza.tools, websearch_to_tsquery('russian', $1) AS tsq
        WHERE published
          AND (search_tsv @@ tsq OR name ILIKE $2 OR description_ru ILIKE $2 OR repo ILIKE $2)
        ORDER BY ts_rank(search_tsv, tsq) DESC, stars DESC NULLS LAST
        LIMIT 10
        """,
        q,
        like,
    )
    prompts = await pool.fetch(
        """
        SELECT slug, title, category
        FROM baza.prompts, websearch_to_tsquery('russian', $1) AS tsq
        WHERE published
          AND (search_tsv @@ tsq OR title ILIKE $2 OR body ILIKE $2)
        ORDER BY ts_rank(search_tsv, tsq) DESC, copies_count DESC
        LIMIT 10
        """,
        q,
        like,
    )
    guide_lessons = await pool.fetch(
        "SELECT slug, title, summary, level FROM baza.guide_lessons "
        "WHERE published AND (title ILIKE $1 OR summary ILIKE $1 OR body_md ILIKE $1) LIMIT 10",
        like,
    )
    components = await pool.fetch(
        "SELECT slug, title, summary, comp_type FROM baza.cc_components "
        "WHERE published AND (search_tsv @@ plainto_tsquery('russian', $1) OR title ILIKE $2) LIMIT 10",
        q,
        like,
    )

    await _log_search(
        user["tg_id"],
        q,
        {
            "entries": len(entries),
            "tools": len(tools),
            "prompts": len(prompts),
            "guide": len(guide_lessons),
            "components": len(components),
        },
    )

    return {
        "entries": [{**dict(r), "type": "entry"} for r in entries],
        "tools": [{**dict(r), "type": "tool"} for r in tools],
        "prompts": [{**dict(r), "type": "prompt"} for r in prompts],
        "guide": [{**dict(r), "type": "guide"} for r in guide_lessons],
        "components": [{**dict(r), "type": "component"} for r in components],
    }
