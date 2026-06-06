"""Pydantic schemas for request/response serialization."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BatchRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: str
    product_name: str
    temperature_reading: float
    temp_spec_min: float
    temp_spec_max: float
    production_date: datetime
    operator_id: str
    status: str
    created_at: datetime


class CapaRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    finding_id: int
    root_cause: str
    corrective_action: str
    regulatory_ref: str
    drafted_by: str
    status: str
    created_at: datetime
    approved_at: datetime | None = None
    approved_by: str | None = None


class AuditFindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_record_id: int
    finding_type: str
    severity: str
    description: str
    regulatory_ref: str
    detected_at: datetime
    status: str


class AuditFindingDetail(AuditFindingOut):
    """Full evidence package: finding + originating batch + drafted CAPA."""

    batch_record: BatchRecordOut | None = None
    capa: CapaRecordOut | None = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    entity_id: str
    action: str
    actor: str
    timestamp: datetime


class CapaApproveRequest(BaseModel):
    approved_by: str


class DetectResult(BaseModel):
    batches_scanned: int
    deviations_found: int
    findings_created: int
    capas_drafted: int
    findings: list[AuditFindingOut]


class HealthResponse(BaseModel):
    status: str
    database: str
