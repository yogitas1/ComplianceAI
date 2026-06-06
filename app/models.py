"""SQLAlchemy ORM models for the AuditAI compliance backend.

Column types mirror the existing Supabase schema: ``production_date`` is a
DATE, ``audit_log.entity_id`` is an INTEGER, and ``audit_log`` carries an
``automated`` flag.
"""
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BatchRecord(Base):
    __tablename__ = "batch_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    product_name: Mapped[str] = mapped_column(String(255))
    temperature_reading: Mapped[float] = mapped_column(Float)
    temp_spec_min: Mapped[float] = mapped_column(Float)
    temp_spec_max: Mapped[float] = mapped_column(Float)
    production_date: Mapped[date] = mapped_column(Date)
    operator_id: Mapped[str] = mapped_column(String(64))
    # "compliant" | "deviation"
    status: Mapped[str] = mapped_column(String(32), default="compliant")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    findings: Mapped[list["AuditFinding"]] = relationship(
        back_populates="batch_record", cascade="all, delete-orphan"
    )


class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_record_id: Mapped[int] = mapped_column(
        ForeignKey("batch_records.id"), index=True
    )
    finding_type: Mapped[str] = mapped_column(String(255))
    # "critical" | "major" | "minor"
    severity: Mapped[str] = mapped_column(String(32))
    description: Mapped[str] = mapped_column(Text)
    regulatory_ref: Mapped[str] = mapped_column(String(255))
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
    # "open" | "capa_drafted" | "approved" | "closed"
    status: Mapped[str] = mapped_column(String(32), default="open")

    batch_record: Mapped["BatchRecord"] = relationship(
        back_populates="findings"
    )
    capa: Mapped["CapaRecord | None"] = relationship(
        back_populates="finding",
        uselist=False,
        cascade="all, delete-orphan",
    )


class CapaRecord(Base):
    __tablename__ = "capa_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    finding_id: Mapped[int] = mapped_column(
        ForeignKey("audit_findings.id"), index=True
    )
    root_cause: Mapped[str] = mapped_column(Text)
    corrective_action: Mapped[str] = mapped_column(Text)
    regulatory_ref: Mapped[str] = mapped_column(String(255))
    drafted_by: Mapped[str] = mapped_column(String(64), default="AuditAI")
    # "draft" | "approved" | "closed"
    status: Mapped[str] = mapped_column(String(32), default="draft")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    finding: Mapped["AuditFinding"] = relationship(back_populates="capa")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[int] = mapped_column(Integer)
    action: Mapped[str] = mapped_column(String(200))
    actor: Mapped[str] = mapped_column(String(128))
    automated: Mapped[bool] = mapped_column(Boolean, default=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
