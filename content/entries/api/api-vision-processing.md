---
slug: api-vision-processing
title: "Vision API: обработка изображений"
summary: "Как Claude анализирует UI-макеты и скриншоты, лимиты по весу файлов и расчёт токенов за картинки."
section: api
tags: [api, vision, images]
doc_url: "https://platform.claude.com"
sort_order: 80
published: true
---

### ❓ Что это
Vision API — мультимодальная способность моделей принимать изображения (PNG, JPEG, WebP, GIF) наряду с текстом для OCR, анализа макетов и UI-аудита по скриншотам.

### 🎯 Зачем тебе
Вместо словесного описания бага можно отправить скриншот верстки — модель сопоставит визуальное смещение элементов с кодом стилей и предложит патч.

### 💻 Минимальный пример
```python
import base64
with open("screenshot.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

response = client.messages.create(
    model="claude-sonnet-5", max_tokens=1024,
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_data}},
        {"type": "text", "text": "Найди UI-баг и предложи CSS-фикс"}
    ]}]
)
```

### ⚠️ Грабли
Картинки обходятся дорого в токенах в зависимости от разрешения. Без Prompt Caching при каждом новом вопросе в длинном чате изображение пересчитывается заново — делай ресайз перед отправкой.

### 🔗 Первоисточник
platform.claude.com — Vision
