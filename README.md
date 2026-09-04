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
- `DATABASE_URL` — default `sqlite+aiosqlite:///plagcheck.db`. For Postgres, set a `postgres://` or `postgresql+asyncpg://` URL (asyncpg dialect is auto-added).
- `SECRET_KEY` — JWT signing key. **No hardcoded default ships**; if unset a random key is generated at startup (sessions reset on restart). Set a persistent random value in prod.
- `FRONTEND_ORIGIN` — comma-separated allowed CORS origins (default `http://localhost:3000`).
- `BING_API_KEY` — web plagiarism search (optional; reference-doc matching works without it)

## Production deploy (Render)
The included `render.yaml` deploys the API as a Docker web service with a managed Postgres
and a `preDeployCommand` (`alembic upgrade head`) that runs migrations before startup.
Connect the GitHub repo on Render, set env vars in the dashboard:
- `SECRET_KEY` — long random value (e.g. `openssl rand -hex 32`)
- `FRONTEND_ORIGIN` — the deployed frontend origin (`https://<your-app>.onrender.com`, etc.)

Production start (no `--reload`, workers via `WEB_CONCURRENCY`):
```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1}
```

Auth endpoints are rate-limited per IP (default 20/min; `AUTH_RATE_LIMIT_PER_MINUTE`).

## Tests
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
pytest tests/ -x
```

