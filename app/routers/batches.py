"""Batch record endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BatchRecord
from app.schemas import BatchRecordOut

router = APIRouter(prefix="/api", tags=["batches"])


@router.get("/batches", response_model=list[BatchRecordOut])
def list_batches(db: Session = Depends(get_db)) -> list[BatchRecord]:
    """List all batch records."""
    return list(db.scalars(select(BatchRecord).order_by(BatchRecord.id)).all())
