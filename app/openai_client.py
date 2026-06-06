"""OpenAI integration for FDA 21 CFR Part 820 compliance analysis."""
import json

from openai import OpenAI

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.models import BatchRecord

SYSTEM_PROMPT = (
    "You are an FDA 21 CFR Part 820 compliance expert. Given a batch record "
    "deviation, return a JSON object with: finding_type, severity, "
    "description, regulatory_ref, root_cause, corrective_action. Be specific "
    "and cite exact regulatory sections."
)

# Keys we expect the model to return; used for validation/fallbacks.
_EXPECTED_KEYS = (
    "finding_type",
    "severity",
    "description",
    "regulatory_ref",
    "root_cause",
    "corrective_action",
)

# DB severity is constrained to these values; map common synonyms the model
# may return (e.g. "High", "Medium") onto the allowed set.
_SEVERITY_MAP = {
    "critical": "critical",
    "high": "critical",
    "severe": "critical",
    "major": "major",
    "medium": "major",
    "moderate": "major",
    "minor": "minor",
    "low": "minor",
    "negligible": "minor",
}

# Max lengths of the corresponding varchar columns in the database.
_FINDING_TYPE_MAX = 100
_REGULATORY_REF_MAX = 100


def _normalize_severity(value: str) -> str:
    return _SEVERITY_MAP.get((value or "").strip().lower(), "major")


def _build_user_prompt(batch: BatchRecord) -> str:
    return (
        "Batch record deviation detected:\n"
        f"- Batch ID: {batch.batch_id}\n"
        f"- Product: {batch.product_name}\n"
        f"- Temperature reading: {batch.temperature_reading} C\n"
        f"- Specification range: {batch.temp_spec_min} C to "
        f"{batch.temp_spec_max} C\n"
        f"- Operator: {batch.operator_id}\n"
        f"- Production date: {batch.production_date.isoformat()}\n\n"
        "Analyze this deviation and return the required JSON object."
    )


def analyze_deviation(batch: BatchRecord) -> dict:
    """Call OpenAI gpt-4o to analyze a batch deviation.

    Returns a dict with the keys defined in ``_EXPECTED_KEYS``. Raises
    ``RuntimeError`` if the API key is not configured.
    """
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured; cannot run detection."
        )

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(batch)},
        ],
    )
    content = response.choices[0].message.content or "{}"
    data = json.loads(content)
    result = {key: str(data.get(key, "") or "") for key in _EXPECTED_KEYS}
    # Conform model output to the database's constraints.
    result["severity"] = _normalize_severity(result["severity"])
    result["finding_type"] = (
        result["finding_type"] or "Temperature deviation"
    )[:_FINDING_TYPE_MAX]
    result["regulatory_ref"] = result["regulatory_ref"][:_REGULATORY_REF_MAX]
    return result
