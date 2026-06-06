"""ERP adaptor used by the AuditAI demo.

The adaptor intentionally uses SQLAlchemy table reflection so it can work with
the demo database's existing ``batch_records`` shape without duplicating model
definitions in this standalone integration layer.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import MetaData, Table, create_engine, insert, select
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import NoSuchTableError

BatchRecord = Dict[str, Any]


class ERPAdaptor:
    """Read batch records from PostgreSQL and simulate live ERP deviations."""

    TABLE_NAME = "batch_records"

    def __init__(self, database_url: Optional[str] = None) -> None:
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise RuntimeError("DATABASE_URL environment variable is required")

        self.engine: Engine = create_engine(self.database_url, future=True)

    def fetch_batch_records(self) -> List[BatchRecord]:
        """Return all records from the ERP ``batch_records`` table."""

        with self.engine.connect() as connection:
            table = self._batch_records_table(connection)
            rows = connection.execute(select(table)).mappings().all()
            return [dict(row) for row in rows]

    def simulate_new_deviation(self) -> BatchRecord:
        """Insert an out-of-spec temperature record for the live demo."""

        with self.engine.begin() as connection:
            table = self._batch_records_table(connection)
            values = self._deviation_values_for(table)

            result = connection.execute(insert(table).values(values).returning(table))
            row = result.mappings().one()
            return dict(row)

    def _batch_records_table(self, connection: Connection) -> Table:
        metadata = MetaData()
        try:
            return Table(self.TABLE_NAME, metadata, autoload_with=connection)
        except NoSuchTableError as exc:
            raise RuntimeError(
                f"Required table '{self.TABLE_NAME}' was not found in DATABASE_URL"
            ) from exc

    def _deviation_values_for(self, table: Table) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        available_columns = set(table.c.keys())

        candidate_values: Dict[str, Any] = {
            "batch_id": "BCH-2024-0901",
            "batch_number": "BCH-2024-0901",
            "batch": "BCH-2024-0901",
            "product": "NeuroPatch Electrode Array",
            "product_name": "NeuroPatch Electrode Array",
            "temperature": 31.2,
            "temperature_c": 31.2,
            "temp": 31.2,
            "temp_c": 31.2,
            "spec": "15-25°C",
            "spec_range": "15-25°C",
            "temperature_spec": "15-25°C",
            "spec_min": 15.0,
            "spec_min_c": 15.0,
            "temperature_min": 15.0,
            "min_temperature": 15.0,
            "min_temp_c": 15.0,
            "spec_max": 25.0,
            "spec_max_c": 25.0,
            "temperature_max": 25.0,
            "max_temperature": 25.0,
            "max_temp_c": 25.0,
            "status": "out_of_spec",
            "deviation_status": "open",
            "deviation_type": "temperature_out_of_spec",
            "is_deviation": True,
            "out_of_spec": True,
            "source": "erp_simulator",
            "created_at": now,
            "updated_at": now,
            "recorded_at": now,
            "timestamp": now,
        }

        values = {
            column: value
            for column, value in candidate_values.items()
            if column in available_columns
        }

        if not values:
            raise RuntimeError(
                f"Table '{self.TABLE_NAME}' has no recognized columns for deviation insert"
            )

        return values


def _main() -> int:
    adaptor = ERPAdaptor()

    if "--simulate" in sys.argv:
        record = adaptor.simulate_new_deviation()
        print(f"Inserted simulated deviation: {record}")
        return 0

    records = adaptor.fetch_batch_records()
    print(f"Fetched {len(records)} batch records")
    for record in records[:5]:
        print(record)

    if len(records) > 5:
        print(f"... {len(records) - 5} more")

    return 0


if __name__ == "__main__":
    raise SystemExit(_main())

