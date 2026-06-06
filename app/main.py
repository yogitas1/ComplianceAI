"""AuditAI compliance backend — FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    audit_log,
    batches,
    capa,
    detect,
    findings,
    health,
)

app = FastAPI(
    title="AuditAI Compliance Backend",
    description=(
        "AI-powered manufacturing compliance: anomaly detection, audit "
        "findings, and CAPA management backed by OpenAI gpt-4o."
    ),
    version="1.0.0",
)

# CORS: allow all origins for demo purposes.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(batches.router)
app.include_router(findings.router)
app.include_router(detect.router)
app.include_router(capa.router)
app.include_router(audit_log.router)


@app.get("/", tags=["root"])
def root() -> dict:
    return {
        "name": "AuditAI Compliance Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
