from fastapi import APIRouter, Header, HTTPException

from app.gate import check_subscription, rate_limit_recheck, validate_init_data

router = APIRouter(prefix="/api/gate", tags=["gate"])


@router.post("/check")
async def gate_check(x_telegram_init_data: str = Header(...)):
    user = validate_init_data(x_telegram_init_data)
    if not user["tg_id"]:
        raise HTTPException(401, "initData: no user")
    subscribed = await check_subscription(user["tg_id"])
    return {"subscribed": subscribed, "user": {"tg_id": user["tg_id"], "username": user["username"]}}


@router.post("/recheck")
async def gate_recheck(x_telegram_init_data: str = Header(...)):
    user = validate_init_data(x_telegram_init_data)
    if not user["tg_id"]:
        raise HTTPException(401, "initData: no user")
    await rate_limit_recheck(user["tg_id"])
    subscribed = await check_subscription(user["tg_id"], force=True)
    return {"subscribed": subscribed}
