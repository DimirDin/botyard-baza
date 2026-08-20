---
slug: eval-llm-as-judge
title: "LLM-as-judge: когда оценщик — тоже модель"
summary: "Как оценивать субъективное моделью, почему судья должен быть другой моделью и как писать промпт-грейдер."
section: theory
group: evals
tags: [evals, llm-judge, quality]
doc_url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"
sort_order: 20
published: true
---

![LLM-as-judge](/entry-images/thinking-process.jpg)

### ❓ Что это

Когда критерий субъективен — тон, вежливость, полезность — кодом его не проверишь. Тогда
оценку доверяют модели: она ставит балл по шкале Лайкерта или отвечает бинарно.

Главное правило документации: **«как правило, лучшая практика — оценивать другой моделью,
не той, что породила оцениваемый вывод»**. Иначе модель судит саму себя, и оценка смещается.

### 🎯 Зачем тебе

Промпт-грейдер должен выдавать **только число или только слово** — иначе парсинг превращается
в отдельный источник ошибок.

### 💻 Минимальный пример

Оценка тона по пятибалльной шкале:

```python
def evaluate_likert(model_output, target_tone):
    tone_prompt = f"""Rate this customer service response on a scale of 1-5 for being {target_tone}:
    <response>{model_output}</response>
    1: Not at all {target_tone}
    5: Perfectly {target_tone}
    Output only the number."""

    response = client.messages.create(
        model="claude-opus-5",
        max_tokens=50,
        messages=[{"role": "user", "content": tone_prompt}],
    )
    return int(next(block.text for block in response.content if block.type == "text").strip())
```

Бинарная проверка строится так же — например, «содержит ли ответ персональные медицинские
данные», с ответом строго `yes`/`no`.

Помимо оценки моделью есть два кодовых способа для полуформальных критериев:

- **Семантическая близость** — эмбеддинги и косинусное расстояние: похожие вопросы должны
  давать семантически похожие ответы.
- **ROUGE-L** — длиннейшая общая подпоследовательность с эталоном, для суммаризации: высокий
  ROUGE-L означает, что выжимка ухватила ключевое в связном порядке.

### ⚠️ Грабли

- **Судить той же моделью.** Самая частая и самая незаметная ошибка — оценки поедут вверх.
- **`max_tokens` впритык.** Ставь запас (в примере 50 на одну цифру): урезанный ответ
  сломает `int()`.
- **Свободная форма ответа судьи.** «Output only the number» — не вежливость, а требование:
  без него получишь «I'd rate this a 4 because…» и упадёшь на парсинге.
- **Шкала без определений концов.** Если не написать, что такое 1 и что такое 5, судья
  придумает свою шкалу, и она поплывёт между запусками.

### 🔗 Первоисточник
LLM-based grading — platform.claude.com/docs/en/test-and-evaluate/develop-tests
