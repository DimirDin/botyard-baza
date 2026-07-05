"""
Офлайн RU→EN перевод для сравнения токенизации в калькуляторе (§10 части 1).
Намеренно без внешних платных API — проект не хранит ключ Anthropic (см. CLAUDE.md).

argostranslate грузит нейросетевую модель (~100-200МБ) в память при первом вызове —
backend лимитирован 0.5 vCPU / 512MB, так что любой сбой (нехватка памяти, пакет не
установлен) должен тихо деградировать до отсутствия перевода, а не ронять подсчёт RU.
"""
import logging

logger = logging.getLogger(__name__)

_translator = None
_unavailable = False  # выставляется после первого сбоя — не пытаемся грузить модель снова


def _get_translator():
    global _translator, _unavailable
    if _translator is not None:
        return _translator
    import argostranslate.package
    import argostranslate.translate

    installed = argostranslate.translate.get_installed_languages()
    from_lang = next((l for l in installed if l.code == "ru"), None)
    to_lang = next((l for l in installed if l.code == "en"), None)

    if not from_lang or not to_lang:
        # Пакет ru->en не был предустановлен на образе — качаем один раз (нужна сеть,
        # дальше работает офлайн). Если сети нет или упадёт по памяти — исключение
        # уйдёт наверх и translate_ru_to_en() пометит переводчик недоступным насовсем.
        argostranslate.package.update_package_index()
        available = argostranslate.package.get_available_packages()
        pkg = next(p for p in available if p.from_code == "ru" and p.to_code == "en")
        argostranslate.package.install_from_path(pkg.download())

        installed = argostranslate.translate.get_installed_languages()
        from_lang = next(l for l in installed if l.code == "ru")
        to_lang = next(l for l in installed if l.code == "en")

    _translator = from_lang.get_translation(to_lang)
    return _translator


def translate_ru_to_en(text: str) -> str | None:
    """Возвращает перевод или None, если argostranslate недоступен/упал — вызывающий
    код (calc.py) должен в этом случае просто не показывать EN-полосу."""
    global _unavailable
    if _unavailable:
        return None
    try:
        translator = _get_translator()
        return translator.translate(text)
    except Exception:
        _unavailable = True
        logger.warning("translate_ru_to_en недоступен, EN-полоса калькулятора отключена", exc_info=True)
        return None
