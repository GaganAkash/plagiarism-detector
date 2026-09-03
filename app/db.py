from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings


def _async_url(url: str) -> str:
    # Render/Heroku expose DATABASE_URL as postgres://... (sync driver). The app
    # uses an async engine, so normalize to the asyncpg dialect when needed.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+" not in url.split("://")[0]:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(_async_url(settings.database_url))
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session
