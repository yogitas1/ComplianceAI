"""Anomaly detection endpoint backed by OpenAI gpt-4o."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit import log_action
from app.database import get_db
from app.models import AuditFinding, BatchRecord, CapaRecord
from app.openai_client import analyze_deviation
from app.schemas import DetectResult

router = APIRouter(prefix="/api", tags=["detect"])


def _is_out_of_spec(batch: BatchRecord) -> bool:
    return (
        batch.temperature_reading < batch.temp_spec_min
        or batch.temperature_reading > batch.temp_spec_max
    )


@router.post("/detect", response_model=DetectResult)
def detect(db: Session = Depends(get_db)) -> DetectResult:
    """Scan all batches for out-of-spec readings and analyze deviations.

    For each deviation without an existing finding, calls OpenAI gpt-4o to
    produce a compliance analysis, inserts an ``audit_findings`` row and a
    drafted ``capa_records`` row, and logs every action to ``audit_log``.
    """
    batches = list(db.scalars(select(BatchRecord)).all())

    existing_finding_batch_ids = set(
        db.scalars(select(AuditFinding.batch_record_id)).all()
    )

    deviations = [b for b in batches if _is_out_of_spec(b)]

    created_findings: list[AuditFinding] = []
    capas_drafted = 0

    for batch in deviations:
        if batch.status != "deviation":
            batch.status = "deviation"

        # Skip batches that already have a finding (idempotent re-runs).
        if batch.id in existing_finding_batch_ids:
            continue

        try:
            analysis = analyze_deviation(batch)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001 - surface upstream API errors
            raise HTTPException(
                status_code=502,
                detail=f"OpenAI analysis failed: {exc}",
            ) from exc

        finding = AuditFinding(
            batch_record_id=batch.id,
            finding_type=analysis["finding_type"] or "Temperature deviation",
            severity=analysis["severity"] or "major",
            description=analysis["description"],
            regulatory_ref=analysis["regulatory_ref"],
            status="capa_drafted",
        )
        db.add(finding)
        db.flush()  # assign finding.id

        log_action(
            db,
            entity_type="audit_finding",
            entity_id=finding.id,
            action="finding_created",
            actor="AuditAI",
        )

        capa = CapaRecord(
            finding_id=finding.id,
            root_cause=analysis["root_cause"],
            corrective_action=analysis["corrective_action"],
            regulatory_ref=analysis["regulatory_ref"],
            drafted_by="AuditAI",
            status="draft",
        )
        db.add(capa)
        db.flush()
        capas_drafted += 1

        log_action(
            db,
            entity_type="capa_record",
            entity_id=capa.id,
            action="capa_drafted",
            actor="AuditAI",
        )

        log_action(
            db,
            entity_type="batch_record",
            entity_id=batch.id,
            action="deviation_detected",
            actor="AuditAI",
        )

        created_findings.append(finding)

    db.commit()
    for finding in created_findings:
        db.refresh(finding)

    return DetectResult(
        batches_scanned=len(batches),
        deviations_found=len(deviations),
        findings_created=len(created_findings),
        capas_drafted=capas_drafted,
        findings=created_findings,
    )
