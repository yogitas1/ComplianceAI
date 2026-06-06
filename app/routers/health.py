"""Health check endpoint."""
from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    """Return service status and database connectivity state."""
    db_state = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_state = "connected"
    except Exception:
        db_state = "disconnected"

    status = "ok" if db_state == "connected" else "degraded"
    return HealthResponse(status=status, database=db_state)
