import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    # ponytail: SQLite default for zero-config local runs; set DATABASE_URL for Postgres in prod.
    database_url: str = "sqlite+aiosqlite:///plagcheck.db"
    redis_url: str = "redis://localhost:6379/0"
    # No hardcoded default secret. If unset we generate a random one at startup so the
    # public repo never ships a predictable key; set SECRET_KEY in prod for persistent JWTs.
    secret_key: str = ""
    # Comma-separated allowed CORS origins. Prod sets FRONTEND_ORIGIN.
    frontend_origin: str = "http://localhost:3000"
    bing_api_key: str = ""
    max_file_size_mb: int = 50
    max_pages: int = 500
    # In-memory rate limit for auth endpoints (per IP). Fine for a single-instance deploy.
    auth_rate_limit_per_minute: int = 20
    # OTP + email (Gmail app password by default). Set these for email OTP to work.
    otp_minutes: int = 5
    email_from: str = ""  # e.g. "you@gmail.com"
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_username: str = ""  # gmail address
    email_password: str = ""  # app password (not normal password)
    email_enabled: bool = False

    def otp_ttl_seconds(self) -> int:
        return self.otp_minutes * 60

    def resolved_secret_key(self) -> str:
        return self.secret_key or secrets.token_hex(32)


settings = Settings()

# Build the CORS allow list; if FRONTEND_ORIGIN holds multiple comma-separated origins.
ALLOWED_ORIGINS = [o.strip() for o in settings.frontend_origin.split(",") if o.strip()]
