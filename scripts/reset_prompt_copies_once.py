"""
Разовый скрипт: перезаписывает copies_count у промптов реалистичным распределением
(в отличие от seed_prompt_copies_once.py, который добавлял поверх — этот сначала
обнуляет всё). Большинство промптов — 0 (никто не скопировал), чем больше число,
тем меньше промптов с таким значением, диапазон 0-20. Кураторская подборка самых
полезных промптов получает верхний край диапазона (15-20).

Запускать РОВНО ОДИН РАЗ:
    DATABASE_URL=postgresql://user:pass@host:5432/botyard python scripts/reset_prompt_copies_once.py
"""
import asyncio
import os
import random

import asyncpg

# Кураторский топ — реально самые полезные/интересные промпты по содержанию,
# не самые длинные и не случайные: жёсткое ревью и security-аудит (нужны всем),
# RU->EN компрессия (уникальная фишка под кириллический контекст), README-генерация
# (нужна в каждом проекте), реальные debug-кейсы (болезненные, конкретные), и steer —
# менее очевидная, но concептуально сильная группа (корректировка агента на ходу).
TOP_PROMPT_SLUGS = {
    "code-rev-pr-review": 20,
    "code-rev-owasp-audit": 18,
    "compress-ru-task-to-en-prompt": 17,
    "docs-readme": 16,
    "cs-debug-docker-postgres": 16,
    "ops-k8s-debug-crashloop": 15,
    "steer-course-correct": 15,
}

# Веса для промптов вне топа — экспоненциальный спад, большинство в 0.
# индекс = число копирований (0..14), значение = относительный вес.
WEIGHTS = [40, 14, 10, 7, 6, 5, 4, 3, 3, 2, 2, 1, 1, 1, 1]


async def main():
    dsn = os.environ["DATABASE_URL"]
    conn = await asyncpg.connect(dsn)
    try:
        rows = await conn.fetch("SELECT id, slug FROM baza.prompts")
        for row in rows:
            if row["slug"] in TOP_PROMPT_SLUGS:
                count = TOP_PROMPT_SLUGS[row["slug"]]
            else:
                count = random.choices(range(len(WEIGHTS)), weights=WEIGHTS, k=1)[0]
            await conn.execute(
                "UPDATE baza.prompts SET copies_count = $1 WHERE id = $2",
                count, row["id"],
            )
            print(f"{row['slug']}: {count}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
