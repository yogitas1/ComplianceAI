"""CAPA (Corrective And Preventive Action) endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit import log_action
from app.database import get_db
from app.models import AuditFinding, CapaRecord
from app.schemas import CapaApproveRequest, CapaRecordOut

router = APIRouter(prefix="/api", tags=["capa"])


@router.get("/capa/{finding_id}", response_model=CapaRecordOut)
def get_capa(finding_id: int, db: Session = Depends(get_db)) -> CapaRecord:
    """Get the CAPA drafted for a given finding."""
    capa = db.scalar(
        select(CapaRecord).where(CapaRecord.finding_id == finding_id)
    )
    if capa is None:
        raise HTTPException(
            status_code=404, detail="No CAPA found for this finding"
        )
    return capa


@router.post("/capa/{finding_id}/approve", response_model=CapaRecordOut)
def approve_capa(
    finding_id: int,
    payload: CapaApproveRequest,
    db: Session = Depends(get_db),
) -> CapaRecord:
    """Approve the CAPA for a finding.

    Sets ``approved_at`` to now and ``approved_by`` from the request body,
    and advances both the CAPA and its finding status.
    """
    capa = db.scalar(
        select(CapaRecord).where(CapaRecord.finding_id == finding_id)
    )
    if capa is None:
        raise HTTPException(
            status_code=404, detail="No CAPA found for this finding"
        )

    capa.status = "approved"
    capa.approved_at = datetime.now(timezone.utc)
    capa.approved_by = payload.approved_by

    finding = db.get(AuditFinding, finding_id)
    if finding is not None:
        finding.status = "approved"

    log_action(
        db,
        entity_type="capa_record",
        entity_id=capa.id,
        action="approved",
        actor=payload.approved_by,
    )

    db.commit()
    db.refresh(capa)
    return capa
