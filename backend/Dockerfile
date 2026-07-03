FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Кэшируем BPE-словарь tiktoken в образе, чтобы контейнер не тянул его из интернета в рантайме
RUN python -c "import tiktoken; tiktoken.get_encoding('cl100k_base')"
COPY app ./app
EXPOSE 3015
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3015"]
