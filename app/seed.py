"""Seed the database with the demo manufacturing-compliance scenario.

Run with: ``python -m app.seed``

Inserts one out-of-spec batch (BCH-2024-0892) plus four compliant batches
as background data. Idempotent: skips seeding if BCH-2024-0892 already exists.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.audit import log_action
from app.database import SessionLocal
from app.models import BatchRecord

_NOW = datetime.now(timezone.utc)
_YESTERDAY = _NOW - timedelta(days=1)


# The headline deviation scenario.
DEVIATION_BATCH = dict(
    batch_id="BCH-2024-0892",
    product_name="CardioFlow Valve 3mm",
    temperature_reading=28.4,
    temp_spec_min=15.0,
    temp_spec_max=25.0,
    production_date=_YESTERDAY,
    operator_id="OP-441",
    status="deviation",
)

# Four compliant background batches.
COMPLIANT_BATCHES = [
    dict(
        batch_id="BCH-2024-0888",
        product_name="CardioFlow Valve 3mm",
        temperature_reading=19.2,
        temp_spec_min=15.0,
        temp_spec_max=25.0,
        production_date=_NOW - timedelta(days=5),
        operator_id="OP-441",
        status="compliant",
    ),
    dict(
        batch_id="BCH-2024-0889",
        product_name="CardioFlow Valve 5mm",
        temperature_reading=21.7,
        temp_spec_min=15.0,
        temp_spec_max=25.0,
        production_date=_NOW - timedelta(days=4),
        operator_id="OP-309",
        status="compliant",
    ),
    dict(
        batch_id="BCH-2024-0890",
        product_name="NeuroStent 2mm",
        temperature_reading=17.5,
        temp_spec_min=15.0,
        temp_spec_max=25.0,
        production_date=_NOW - timedelta(days=3),
        operator_id="OP-512",
        status="compliant",
    ),
    dict(
        batch_id="BCH-2024-0891",
        product_name="CardioFlow Valve 3mm",
        temperature_reading=23.9,
        temp_spec_min=15.0,
        temp_spec_max=25.0,
        production_date=_NOW - timedelta(days=2),
        operator_id="OP-309",
        status="compliant",
    ),
]


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(
            select(BatchRecord).where(
                BatchRecord.batch_id == DEVIATION_BATCH["batch_id"]
            )
        )
        if existing is not None:
            print("Seed data already present; skipping.")
            return

        records = [BatchRecord(**DEVIATION_BATCH)] + [
            BatchRecord(**data) for data in COMPLIANT_BATCHES
        ]
        db.add_all(records)
        db.flush()

        for record in records:
            log_action(
                db,
                entity_type="batch_record",
                entity_id=record.id,
                action="batch_seeded",
                actor="system",
            )

        db.commit()
        print(f"Seeded {len(records)} batch records.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
