from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    # ponytail: SQLite default for zero-config local runs; set DATABASE_URL for Postgres in prod.
    database_url: str = "sqlite+aiosqlite:///plagcheck.db"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-in-production"
    bing_api_key: str = ""
    max_file_size_mb: int = 50
    max_pages: int = 500


settings = Settings()
