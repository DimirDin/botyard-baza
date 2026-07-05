"""
Разовый скрипт: проставляет правдоподобные copies_count промптам, чтобы
приложение не выглядело пустым при запуске. Запускать РОВНО ОДИН РАЗ,
после — удалить или не запускать повторно (не идемпотентен: добавляет
поверх текущего значения).

Использование:
    DATABASE_URL=postgresql://user:pass@host:5432/botyard python scripts/seed_prompt_copies_once.py
"""
import asyncio
import os
import random

import asyncpg

# 5-8 «топовых» промптов — выбраны как самые универсальные/часто нужные категории
# (code review, генерация, компрессия контекста, debug, PR-review). Слаги должны
# совпадать с content/prompts.yaml на момент запуска — если слаг не найден, пропускается.
TOP_PROMPT_SLUGS = {
    "code-rev-pr-review",
    "code-rev-owasp-audit",
    "compress-ru-task-to-en-prompt",
    "docs-readme",
    "devops-github-actions-deploy",
    "cs-debug-docker-postgres",
}


async def main():
    dsn = os.environ["DATABASE_URL"]
    conn = await asyncpg.connect(dsn)
    try:
        rows = await conn.fetch("SELECT id, slug FROM baza.prompts")
        for row in rows:
            bump = random.randint(50, 100) if row["slug"] in TOP_PROMPT_SLUGS else random.randint(1, 25)
            await conn.execute(
                "UPDATE baza.prompts SET copies_count = copies_count + $1 WHERE id = $2",
                bump, row["id"],
            )
            print(f"{row['slug']}: +{bump}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
