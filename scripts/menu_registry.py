"""
Разбор frontend/src/config/menu.js → множества допустимых пар {tab}/{group}.

Зачем: `category` в tools.yaml/prompts.yaml и пара section+group в статьях ничем
не валидируются на уровне БД. Если написать категорию, которой нет в menu.js,
запись попадёт в БД, будет отвечать по API и в поиске, но останется физически
недостижимой через навигацию (таб → группа). На этом обжигались дважды —
см. BAZA_CONTEXT §7.2. Поэтому синк сверяется с меню и падает до записи в БД.
"""
import re
from pathlib import Path

MENU_JS = Path(__file__).parent.parent / "frontend" / "src" / "config" / "menu.js"

# `export const BASE_MENU = [` — начало реестра
_EXPORT_RE = re.compile(r"^export const (\w+)\s*=\s*\[")
# `    slug: "code",` — слаг таба (отступ 4, без открывающей скобки)
_TAB_RE = re.compile(r'^ {4}slug:\s*"([^"]+)"')
# `      { slug: "claude-code", label: ...` — слаг группы (отступ 6, в фигурной скобке)
_GROUP_RE = re.compile(r'^ {6}\{\s*slug:\s*"([^"]+)"')


def parse_menu(path: Path = MENU_JS) -> dict[str, set[str]]:
    """{"BASE_MENU": {"code/claude-code", ...}, "TOOLS_MENU": {...}, ...}"""
    registries: dict[str, set[str]] = {}
    current_registry: str | None = None
    current_tab: str | None = None

    for line in path.read_text(encoding="utf-8").splitlines():
        m = _EXPORT_RE.match(line)
        if m:
            current_registry = m.group(1)
            registries.setdefault(current_registry, set())
            current_tab = None
            continue
        if current_registry is None:
            continue
        m = _TAB_RE.match(line)
        if m:
            current_tab = m.group(1)
            continue
        m = _GROUP_RE.match(line)
        if m and current_tab:
            registries[current_registry].add(f"{current_tab}/{m.group(1)}")

    return registries


def valid_pairs(registry: str) -> set[str]:
    pairs = parse_menu().get(registry)
    if not pairs:
        raise RuntimeError(
            f"{registry} не найден или пуст в {MENU_JS} — "
            "проверь, не изменился ли формат файла (парсер завязан на отступы)"
        )
    return pairs


if __name__ == "__main__":
    for name, pairs in sorted(parse_menu().items()):
        print(f"{name}: {len(pairs)} групп")
        for p in sorted(pairs):
            print(f"  {p}")
