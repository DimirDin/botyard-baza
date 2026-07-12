import re

from fastapi import APIRouter, Body, Header, HTTPException

from app.gate import check_subscription, rate_limit_recheck, validate_init_data
from app.config import settings

router = APIRouter(prefix="/api/gate", tags=["gate"])

# Метка источника из deep link бота (src_vcru, src_ads1...) — только буквы/цифры/_-,
# чтобы в PG не улетело что попало из подделанного тела запроса.
_SOURCE_RE = re.compile(r"^[a-zA-Z0-9_-]{1,32}$")


def _clean_source(source: str | None) -> str | None:
    if source and _SOURCE_RE.match(source):
        return source
    return None


@router.post("/check")
async def gate_check(x_telegram_init_data: str = Header(...), source: str | None = Body(None, embed=True)):
    user = validate_init_data(x_telegram_init_data)
    if not user["tg_id"]:
        raise HTTPException(401, "initData: no user")
    subscribed = await check_subscription(user["tg_id"], source=_clean_source(source))
    is_admin = user["tg_id"] in settings.admin_ids
    return {
        "subscribed": subscribed,
        "user": {
            "tg_id": user["tg_id"],
            "username": user["username"],
            "is_admin": is_admin
        }
    }


@router.post("/recheck")
async def gate_recheck(x_telegram_init_data: str = Header(...)):
    user = validate_init_data(x_telegram_init_data)
    if not user["tg_id"]:
        raise HTTPException(401, "initData: no user")
    await rate_limit_recheck(user["tg_id"])
    subscribed = await check_subscription(user["tg_id"], force=True)
    return {"subscribed": subscribed}
