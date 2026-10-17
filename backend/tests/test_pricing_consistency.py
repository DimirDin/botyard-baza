"""Цены в калькуляторе не должны расходиться со шпаргалкой.

Зачем этот тест: 03.09.2026 нашли, что `content/cheatsheets/api-limits-and-models.md`
и `MODEL_PRICING` в calc.py разошлись с реальностью одинаково — в шпаргалке стояла
цена Sonnet 5 $3/$15 с пометкой «промо $2/$10 до 31.08.2026», хотя Anthropic отменила
этот подъём и $2/$10 стал обычным тарифом. Ошибка из шпаргалки была скопирована
в код (там прямо стоит комментарий «сверено с api-limits-and-models.md»), и калькулятор
завышал стоимость дефолтной модели в полтора раза.

Тест не знает «правильных» цен — он лишь требует, чтобы два источника совпадали.
Актуальность самих цифр по-прежнему сверяется руками с platform.claude.com.
"""
import re
from pathlib import Path

import pytest

from app.routers.calc import (
    CONTEXT_WINDOW,
    DEFAULT_MODEL,
    MODEL_PRICING,
    NEWER_TOKENIZER_MODELS,
    cache_read_multiplier,
    input_pricing,
)

CHEATSHEET = Path(__file__).parent.parent.parent / "content" / "cheatsheets" / "api-limits-and-models.md"

# Как модель называется в шпаргалке → её id в калькуляторе
LABEL_TO_ID = {
    "Claude Fable 5.1": "claude-fable-5-1",
    "Claude Opus 5.5": "claude-opus-5-5",
    "Claude Sonnet 5.5": "claude-sonnet-5-5",
    "Claude Haiku 5.5": "claude-haiku-5-5",
    "Claude Fable 5": "claude-fable-5",
    "Claude Opus 5": "claude-opus-5",
    "Claude Opus 4.8": "claude-opus-4-8",
    "Claude Sonnet 5": "claude-sonnet-5",
    "Claude Haiku 4.5": "claude-haiku-4-5",
}

ROW = re.compile(
    r"^\|\s*(Claude [^|]+?)\s*\|\s*([\d.]+)([kM])\s*\|\s*\$([\d.]+)\s*/\s*\$([\d.]+)\s*\|",
    re.M,
)


def parse_cheatsheet() -> dict[str, dict]:
    text = CHEATSHEET.read_text(encoding="utf-8")
    out = {}
    for label, ctx, unit, inp, outp in ROW.findall(text):
        model_id = LABEL_TO_ID.get(label.strip())
        if not model_id:
            continue  # модель есть в шпаргалке, но не в дропдауне калькулятора — это нормально
        out[model_id] = {
            "input": float(inp),
            "output": float(outp),
            "context": int(float(ctx) * (1_000_000 if unit == "M" else 1_000)),
        }
    return out


def test_cheatsheet_parses():
    """Если разметка таблицы поедет, тест ниже станет бессмысленно зелёным."""
    parsed = parse_cheatsheet()
    assert len(parsed) >= 4, f"из шпаргалки разобрано слишком мало моделей: {parsed}"


@pytest.mark.parametrize("model_id", sorted(MODEL_PRICING))
def test_every_calculator_model_is_in_cheatsheet(model_id):
    assert model_id in parse_cheatsheet(), (
        f"{model_id} есть в калькуляторе, но не в шпаргалке — "
        "пользователь увидит цену, которую нечем проверить"
    )


@pytest.mark.parametrize("model_id", sorted(MODEL_PRICING))
def test_pricing_matches_cheatsheet(model_id):
    expected = parse_cheatsheet()[model_id]
    assert MODEL_PRICING[model_id]["input"] == expected["input"], f"input {model_id}"
    assert MODEL_PRICING[model_id]["output"] == expected["output"], f"output {model_id}"


@pytest.mark.parametrize("model_id", sorted(CONTEXT_WINDOW))
def test_context_window_matches_cheatsheet(model_id):
    assert CONTEXT_WINDOW[model_id] == parse_cheatsheet()[model_id]["context"]


def test_sonnet5_is_not_priced_as_the_cancelled_increase():
    """Регресс на конкретный найденный баг: подъём до $3/$15 не состоялся."""
    assert MODEL_PRICING["claude-sonnet-5"] == {"input": 2.00, "output": 10.00}


def test_default_model_is_current_generation():
    """Дефолт калькулятора не должен застревать на прошлом поколении (17.10.2026 нашли,
    что месяц после выхода 5.5 дефолтом оставался Sonnet 5)."""
    assert DEFAULT_MODEL == "claude-sonnet-5-5"
    assert DEFAULT_MODEL in MODEL_PRICING


def test_haiku_55_long_prompt_tier():
    """До 100k — $0.10/$0.50, свыше — весь запрос по $0.50/$2.50."""
    short = input_pricing("claude-haiku-5-5", 100_000)
    long = input_pricing("claude-haiku-5-5", 100_001)
    assert (short["input"], short["output"], short["long_prompt"]) == (0.10, 0.50, False)
    assert (long["input"], long["output"], long["long_prompt"]) == (0.50, 2.50, True)


def test_long_prompt_tier_is_haiku_only():
    for model_id in MODEL_PRICING:
        if model_id != "claude-haiku-5-5":
            assert input_pricing(model_id, 900_000)["long_prompt"] is False, model_id


@pytest.mark.parametrize("model_id,expected", [
    ("claude-opus-5-5", 0.05),
    ("claude-sonnet-5-5", 0.05),
    ("claude-fable-5-1", 0.025),
    ("claude-sonnet-5", 0.1),
    ("claude-haiku-5-5", 0.1),
])
def test_cache_read_multiplier(model_id, expected):
    assert cache_read_multiplier(model_id) == expected


@pytest.mark.parametrize("model_id", sorted(MODEL_PRICING))
def test_tokenizer_note_covers_every_47_plus_model(model_id):
    """В дропдауне сейчас только Haiku 4.5 сидит на старом токенайзере."""
    if model_id == "claude-haiku-4-5":
        assert model_id not in NEWER_TOKENIZER_MODELS
    else:
        assert model_id in NEWER_TOKENIZER_MODELS
