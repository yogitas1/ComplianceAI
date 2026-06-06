"""CAPA lifecycle support for the AuditAI demo.

The module exposes both a small service class and a FastAPI router so the
dashboard can request the complete corrective action plan audit timeline.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter


TimelineEvent = dict[str, str | bool]
CAPARecord = dict[str, Any]


class CAPAModule:
    """Manage corrective action plans and their audit trail events."""

    def __init__(self) -> None:
        self._capas: dict[str, CAPARecord] = {}

    def get_capa(self, finding_id: str) -> CAPARecord:
        """Return the corrective action plan for a finding."""
        if finding_id not in self._capas:
            self._capas[finding_id] = self._build_demo_capa(finding_id)

        return deepcopy(self._capas[finding_id])

    def approve_capa(self, finding_id: str, approver_name: str) -> CAPARecord:
        """Approve a corrective action plan and record the human approver."""
        if not approver_name.strip():
            raise ValueError("approver_name is required")

        capa = self._capas.setdefault(finding_id, self._build_demo_capa(finding_id))
        capa["status"] = "approved"
        capa["approved_by"] = approver_name.strip()
        capa["approved_at"] = self._iso(datetime.now(timezone.utc))

        return deepcopy(capa)

    def get_audit_trail(self, finding_id: str) -> list[TimelineEvent]:
        """Return the complete detection-to-approval audit trail."""
        capa = self._capas.setdefault(finding_id, self._build_demo_capa(finding_id))

        timeline: list[TimelineEvent] = [
            {
                "timestamp": capa["detected_at"],
                "event": "Finding detected",
                "actor": "AuditAI",
                "automated": True,
            },
            {
                "timestamp": capa["evidence_assembled_at"],
                "event": "Evidence assembled",
                "actor": "AuditAI",
                "automated": True,
            },
            {
                "timestamp": capa["drafted_at"],
                "event": "CAPA drafted",
                "actor": "AuditAI",
                "automated": True,
            },
            {
                "timestamp": capa["approved_at"],
                "event": "CAPA approved",
                "actor": capa["approved_by"],
                "automated": False,
            },
        ]

        return sorted(timeline, key=lambda event: str(event["timestamp"]))

    def _build_demo_capa(self, finding_id: str) -> CAPARecord:
        detected_at = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(
            minutes=45
        )
        evidence_assembled_at = detected_at + timedelta(minutes=8)
        drafted_at = evidence_assembled_at + timedelta(minutes=12)
        approved_at = drafted_at + timedelta(minutes=18)

        return {
            "finding_id": finding_id,
            "status": "approved",
            "summary": f"Corrective action plan for finding {finding_id}",
            "corrective_actions": [
                "Contain the impacted control gap",
                "Assign process owner remediation",
                "Verify evidence and closure criteria",
            ],
            "owner": "AuditAI",
            "approved_by": "Compliance Manager",
            "detected_at": self._iso(detected_at),
            "evidence_assembled_at": self._iso(evidence_assembled_at),
            "drafted_at": self._iso(drafted_at),
            "approved_at": self._iso(approved_at),
        }

    @staticmethod
    def _iso(timestamp: datetime) -> str:
        return timestamp.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


capa_module = CAPAModule()
router = APIRouter(prefix="/api/capa", tags=["CAPA"])


@router.get("/{finding_id}/timeline")
def get_capa_timeline(finding_id: str) -> list[TimelineEvent]:
    """Return the dashboard-ready CAPA audit timeline."""
    return capa_module.get_audit_trail(finding_id)
