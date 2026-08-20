FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Кэшируем BPE-словарь tiktoken в образе, чтобы контейнер не тянул его из интернета в рантайме
RUN python -c "import tiktoken; tiktoken.get_encoding('cl100k_base')"
COPY backend/app ./app
COPY content ./content
COPY scripts ./scripts
# menu.js — реестр категорий, по которому sync_content.py валидирует контент перед записью
# в БД. Синк запускается внутри этого контейнера, значит реестр должен быть в образе:
# иначе валидация падает с FileNotFoundError и синк не проходит вовсе.
COPY frontend/src/config/menu.js ./frontend/src/config/menu.js
EXPOSE 3015
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3015"]
