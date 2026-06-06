from fastapi import FastAPI, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from adaptors.erp_adaptor import ERPAdaptor

app = FastAPI(title="AuditAI Demo")


@app.post("/api/erp/simulate-deviation")
def simulate_erp_deviation() -> dict:
    """Trigger a live out-of-spec ERP batch record for demo purposes."""

    try:
        record = ERPAdaptor().simulate_new_deviation()
    except (RuntimeError, SQLAlchemyError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"status": "created", "record": record}

