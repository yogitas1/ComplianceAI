from fastapi import FastAPI, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from adaptors.eqms_adaptor import EQMSAdaptor
from adaptors.erp_adaptor import ERPAdaptor
from modules.capa_module import router as capa_router

app = FastAPI(title="AuditAI Demo")
app.include_router(capa_router)
eqms_adaptor = EQMSAdaptor()


@app.post("/api/erp/simulate-deviation")
def simulate_erp_deviation() -> dict:
    """Trigger a live out-of-spec ERP batch record for demo purposes."""

    try:
        record = ERPAdaptor().simulate_new_deviation()
    except (RuntimeError, SQLAlchemyError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"status": "created", "record": record}


@app.get("/api/eqms/check/{batch_id}")
def check_eqms_deviation(batch_id: str) -> dict:
    """Check whether eQMS has a filed deviation for a batch."""

    deviation_filed = eqms_adaptor.check_deviation_filed(batch_id)

    return {
        "batch_id": batch_id,
        "deviation_filed": deviation_filed,
        "gap_detected": not deviation_filed,
    }
