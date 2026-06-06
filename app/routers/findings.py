"""Audit finding endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditFinding
from app.schemas import AuditFindingDetail, AuditFindingOut

router = APIRouter(prefix="/api", tags=["findings"])


@router.get("/findings", response_model=list[AuditFindingOut])
def list_findings(db: Session = Depends(get_db)) -> list[AuditFinding]:
    """List all audit findings."""
    return list(
        db.scalars(select(AuditFinding).order_by(AuditFinding.id)).all()
    )


@router.get("/findings/{finding_id}", response_model=AuditFindingDetail)
def get_finding(
    finding_id: int, db: Session = Depends(get_db)
) -> AuditFinding:
    """Return a single finding with its full evidence package.

    The evidence package includes the originating batch record and the
    drafted CAPA, if any.
    """
    finding = db.get(AuditFinding, finding_id)
    if finding is None:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding
