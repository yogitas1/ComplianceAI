"""Audit log endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api", tags=["audit-log"])


@router.get("/audit-log", response_model=list[AuditLogOut])
def get_audit_log(db: Session = Depends(get_db)) -> list[AuditLog]:
    """Return the full audit trail, most recent first."""
    return list(
        db.scalars(select(AuditLog).order_by(AuditLog.id.desc())).all()
    )
