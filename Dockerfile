FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python -m spacy download en_core_web_sm

# prod-style start: no --reload; worker count via WEB_CONCURRENCY (default 1).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1}"]
