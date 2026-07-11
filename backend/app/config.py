from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    bot_token: str
    channel_username: str = "@claudedry"
    tech_chat_id: str = ""
    database_url: str  # postgresql://user:pass@localhost:5432/botyard
    redis_url: str = "redis://localhost:6379/0"
    admin_tg_ids: str = ""  # comma-separated list of telegram IDs

    # TTL кэша гейта (секунды), см. §5 PROJECT_CONTEXT
    gate_ttl_subscribed: int = 6 * 60 * 60
    gate_ttl_not_subscribed: int = 60
    gate_recheck_rate_limit_sec: int = 5

    @property
    def admin_ids(self) -> set[int]:
        if not self.admin_tg_ids:
            return set()
        return {int(x.strip()) for x in self.admin_tg_ids.split(",") if x.strip().isdigit()}

    class Config:
        env_file = ".env"


settings = Settings()
