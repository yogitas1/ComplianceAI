"""Helper for writing entries to the audit trail."""
from sqlalchemy.orm import Session

from app.models import AuditLog


def log_action(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    action: str,
    actor: str,
    automated: bool = True,
) -> AuditLog:
    """Create an audit_log entry. Caller is responsible for committing."""
    entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor=actor,
        automated=automated,
    )
    db.add(entry)
    return entry
