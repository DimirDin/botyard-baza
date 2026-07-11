import os
import sys
from pathlib import Path

# Settings() требует BOT_TOKEN/DATABASE_URL из окружения при импорте app.config —
# выставляем до любого импорта app.* модулей в тестах.
os.environ.setdefault("BOT_TOKEN", "test-bot-token")
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/baza_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
