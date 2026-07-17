# cc_components — компоненты Claude Code из каталога aitmpl

Кураторская подборка (122 из ~1824) компонентов `davila7/claude-code-templates` (aitmpl.com,
MIT) для Claude Code: суб-агенты, слэш-команды, MCP-серверы, хуки, настройки, скиллы, агентные
циклы. Живёт отдельно от основного контент-пайплайна (`content/entries`, `tools.yaml`,
`prompts.yaml`, `cheatsheets/`, `guide/`) — своя таблица `baza.cc_components`, свой роутер
`/api/components`, `scripts/sync_content.py` эту таблицу не трогает.

**Жёсткое ограничение:** этот пайплайн не имеет права трогать `baza.entries`/`content/entries`
и схему `baza.tools` — родительская карточка `davila7/claude-code-templates` в «Инструментах»
заведена штатно через `content/tools.yaml` (см. корневой README интеграции), это отдельная запись.

## Файлы

| Файл | Что это |
|---|---|
| `selection.json` | Отобранные 122 компонента: `{type, category, name, ru}` — редактируется руками |
| `aitmpl_catalog.csv` | Полный каталог ~1824 компонентов upstream-репозитория — источник путей/имён для валидации и следующих партий |
| `make_seed.py` | Генератор `cc_components_seed.sql` из `selection.json` + `aitmpl_catalog.csv` (stdlib, без зависимостей) |
| `cc_components_seed.sql` | Сгенерированный идемпотентный SQL-сид (не редактировать руками) |
| `fetch_bodies.py` | Качает реальное содержимое компонента (промпт/конфиг/SKILL.md) с GitHub в `bodies_cache.json` |
| `bodies_cache.json` | Кэш скачанного контента: `slug -> {url, content, ext}` (не редактировать руками) |

## Добавить/снять компонент

1. Добавить строку в `selection.json` (`type` ∈ `agents|commands|mcps|hooks|settings|skills|loops`,
   `category`/`name` — ровно как в `aitmpl_catalog.csv`, `ru` — короткое русское описание).
2. `python3 content/components/fetch_bodies.py` — скачает реальный текст компонента с GitHub
   в `bodies_cache.json` (уже скачанные slug пропускаются, `--force` — перекачать всё заново).
3. `python3 content/components/make_seed.py` — перегенерирует `cc_components_seed.sql` (включая
   `body_md` из кэша), скрипт упадёт с понятной ошибкой, если `type/name` не найдены в каталоге
   (не даёт выдумать несуществующий компонент).
4. Закоммитить `selection.json` + `bodies_cache.json` + `cc_components_seed.sql`.
5. На сервере: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f content/components/cc_components_seed.sql`.

**Снять карточку** — не удалять строку, проставить `published=false` вручную
(`UPDATE baza.cc_components SET published=false WHERE slug='...'`). Повторный прогон сида
эту колонку не трогает (`ON CONFLICT DO UPDATE` не включает `published`).

## Миграция схемы

`db/migrations/0008_cc_components.sql` — таблица `baza.cc_components` + FTS (`search_tsv`,
generated column, `to_tsvector('russian', ...)`). Применяется один раз (идемпотентно,
`IF NOT EXISTS` везде), до первого прогона сида.

**Известный нюанс FTS (сознательно не чиним):** русский tsvector-словарь не матчит кириллицу
с латинским написанием — поиск «телеграм» не найдёт компонент с именем/описанием, где
"Telegram" написан латиницей.
