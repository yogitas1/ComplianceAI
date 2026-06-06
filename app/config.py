"""Application configuration loaded from environment variables."""
import os

from dotenv import load_dotenv

load_dotenv()


def _normalize_database_url(url: str) -> str:
    """Normalize a database URL so SQLAlchemy uses the psycopg2 driver.

    InsForge / Heroku style URLs often start with ``postgres://`` which
    SQLAlchemy no longer recognizes. Rewrite it to ``postgresql+psycopg2://``.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


# Fall back to a local SQLite database so the app boots even without a
# DATABASE_URL configured (useful for local development and CI smoke tests).
_RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./auditai.db")
DATABASE_URL = _normalize_database_url(_RAW_DATABASE_URL)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
