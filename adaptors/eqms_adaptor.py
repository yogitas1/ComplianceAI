"""Mock eQMS adaptor used by the AuditAI demo."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class EQMSAdaptor:
    """Read filed deviation reports from a mock eQMS JSON store."""

    def __init__(self, data_path: Path | None = None) -> None:
        self.data_path = data_path or (
            Path(__file__).resolve().parent / "mock_data" / "deviation_reports.json"
        )

    def fetch_deviation_reports(self) -> list[dict[str, Any]]:
        """Return all filed deviation reports from the mock JSON store."""
        with self.data_path.open("r", encoding="utf-8") as report_file:
            reports = json.load(report_file)

        if not isinstance(reports, list):
            raise ValueError("Deviation report store must contain a list of reports.")

        return reports

    def check_deviation_filed(self, batch_id: str) -> bool:
        """Return whether a deviation report has been filed for a batch."""
        return any(
            report.get("batch_id") == batch_id
            for report in self.fetch_deviation_reports()
        )
