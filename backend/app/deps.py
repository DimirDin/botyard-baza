from fastapi import Header, HTTPException, Depends

from app.gate import check_subscription, validate_init_data
from app.config import settings


async def require_subscribed(x_telegram_init_data: str = Header(...)) -> dict:
    """Dependency для всех защищённых роутов — initData валиден И пользователь подписан."""
    user = validate_init_data(x_telegram_init_data)
    if not user["tg_id"]:
        raise HTTPException(401, "initData: no user")
    if not await check_subscription(user["tg_id"]):
        raise HTTPException(403, "Требуется подписка на канал")
    return user


async def require_admin(user: dict = Depends(require_subscribed)) -> dict:
    """Dependency для админских роутов — проверяет, что пользователь в списке администраторов."""
    if user["tg_id"] not in settings.admin_ids:
        raise HTTPException(403, "Доступ запрещен")
    return user
