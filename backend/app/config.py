from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    bot_token: str
    channel_username: str = "@claudedry"
    database_url: str  # postgresql://user:pass@localhost:5432/botyard
    redis_url: str = "redis://localhost:6379/0"

    # TTL кэша гейта (секунды), см. §5 PROJECT_CONTEXT
    gate_ttl_subscribed: int = 6 * 60 * 60
    gate_ttl_not_subscribed: int = 60
    gate_recheck_rate_limit_sec: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
