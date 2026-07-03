from fastapi import Header, HTTPException

from app.gate import check_subscription, validate_init_data


async def require_subscribed(x_telegram_init_data: str = Header(...)) -> dict:
    """Dependency для всех защищённых роутов — initData валиден И пользователь подписан."""
    user = validate_init_data(x_telegram_init_data)
    if not user["tg_id"]:
        raise HTTPException(401, "initData: no user")
    if not await check_subscription(user["tg_id"]):
        raise HTTPException(403, "Требуется подписка на канал")
    return user
