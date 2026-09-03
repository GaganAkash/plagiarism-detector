# Plagiarism & AI Detector

Detects plagiarism (reference-doc + web) and AI-generated text (multi-signal ensemble).

## Stack
- **Backend**: FastAPI + SQLAlchemy (SQLite by default, Postgres via `DATABASE_URL`)
- **AI**: burstiness, n-gram, stylometric ensemble; GPT-2 perplexity auto-enabled when torch is available
- **Plagiarism**: TF-IDF cosine (reference docs) + SBERT paraphrase (when torch available) + Bing web search
- **Files**: PDF (PyMuPDF), DOCX, TXT, OCR fallback for scanned PDFs
- **Scans**: processed inline, no Redis/Celery needed for local/dev

## Run (local, CPU-only)
```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt          # lean; full stack in requirements-full.txt
python -m spacy download en_core_web_sm
alembic upgrade head                      # creates SQLite plagcheck.db
uvicorn app.main:app --port 8000          # or: docker compose up --build
```

Endpoints:
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/documents/upload`
- `POST /api/scan/{document_id}`, `GET /api/scan/{scan_id}`
- Frontend: http://localhost:3000

## Full stack (Docker / Postgres / Celery / torch)
On a target with prebuilt wheels (Apple Silicon / Linux with Docker):
```bash
docker compose up --build
```
`requirements-full.txt` adds torch, sentence-transformers, transformers, asyncpg, celery, redis.

## Config (.env)
- `DATABASE_URL` — default `sqlite+aiosqlite:///plagcheck.db`; set Postgres URL for prod
- `BING_API_KEY` — web plagiarism search (optional; reference-doc matching works without it)
- `SECRET_KEY` — JWT signing key, change in production

## Tests
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
pytest tests/ -x
```

