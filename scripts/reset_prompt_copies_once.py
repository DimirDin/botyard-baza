"""
Разовый скрипт: перезаписывает copies_count у промптов реалистичным распределением
0-5 (обнуляет всё и раскидывает заново). 0 — самое частое значение, 5 — очень редкое.
Три выбранных промпта (компрессия RU->EN, сокращение текста, смена аудитории) —
максимум диапазона (5), это самые часто копируемые.

Запускать РОВНО ОДИН РАЗ:
    DATABASE_URL=postgresql://user:pass@host:5432/botyard python scripts/reset_prompt_copies_once.py
"""
import asyncio
import os
import random

import asyncpg

# Явно указанные пользователем как самые популярные — фиксированное значение 5 (максимум).
TOP_PROMPT_SLUGS = {
    "compress-ru-task-to-en-prompt": 5,   # Сжатие RU-задачи в системный промпт на EN
    "content-rewrite-shorten-no-loss": 5,  # Сократить текст без потери смысла
    "content-rewrite-audience-shift": 5,   # Переписать текст под другую аудиторию
}

# Веса для промптов вне топа — 0 копирований намного чаще, 5 — очень редко.
# индекс = число копирований (0..5), значение = относительный вес.
WEIGHTS = [55, 20, 12, 7, 4, 2]


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
