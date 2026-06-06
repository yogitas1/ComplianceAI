# AuditAI — Manufacturing Compliance Backend

AI-powered manufacturing compliance demo backend. It detects out-of-spec
batch readings, uses OpenAI **gpt-4o** to generate FDA 21 CFR Part 820
findings and CAPA drafts, and maintains a full audit trail.

**Stack:** FastAPI · SQLAlchemy + Alembic · PostgreSQL (InsForge) · OpenAI
gpt-4o · deployed on Vercel.

## Architecture

| Layer | Detail |
|-------|--------|
| API | FastAPI app in `app/main.py`, routers in `app/routers/` |
| ORM | SQLAlchemy models in `app/models.py` |
| Migrations | Alembic (`alembic.ini`, `migrations/`) |
| AI | `app/openai_client.py` — gpt-4o, JSON response mode |
| Deploy | Vercel via `api/index.py` + `vercel.json` (branch `master`) |

### Data model

- **batch_records** — production batches with temperature readings and spec
  ranges; `status` is `compliant` or `deviation`.
- **audit_findings** — findings raised against a batch; `severity` is
  `critical`/`major`/`minor`; `status` is `open`/`capa_drafted`/`approved`/`closed`.
- **capa_records** — Corrective And Preventive Action drafts (`drafted_by`
  is always `AuditAI`); `status` is `draft`/`approved`/`closed`.
- **audit_log** — append-only trail of every action.

## Environment variables

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | PostgreSQL connection string (from InsForge). Falls back to local SQLite if unset. |
| `OPENAI_API_KEY` | OpenAI key; required for `POST /api/detect`. |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o`. |

Copy `.env.example` to `.env` and fill in values.

## Local setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL="postgresql://user:pass@host:5432/db"
export OPENAI_API_KEY="sk-..."

alembic upgrade head      # create tables
python -m app.seed        # insert demo batches
uvicorn app.main:app --reload
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service status + DB connection state |
| GET | `/api/batches` | List all batch records |
| GET | `/api/findings` | List all audit findings |
| GET | `/api/findings/{id}` | Single finding with full evidence package (batch + CAPA) |
| POST | `/api/detect` | Run anomaly detection on all batches (calls OpenAI) |
| GET | `/api/capa/{finding_id}` | Get the CAPA for a finding |
| POST | `/api/capa/{finding_id}/approve` | Approve a CAPA (`{"approved_by": "..."}`) |
| GET | `/api/audit-log` | Full audit trail |

Interactive docs at `/docs`.

## Demo Flow

This walks through the headline scenario: batch **BCH-2024-0892**
("CardioFlow Valve 3mm") was recorded at **28.4 °C**, outside its
**15–25 °C** spec — an out-of-spec deviation. Four compliant batches exist
as background data.

1. **Prepare the database** (once):

   ```bash
   alembic upgrade head
   python -m app.seed
   ```

2. **Confirm the deviation is present.** `BCH-2024-0892` has
   `status: deviation`; the others are `compliant`:

   ```bash
   curl http://localhost:8000/api/batches
   ```

3. **Trigger AI detection.** Scans every batch for out-of-spec readings.
   For each deviation it calls OpenAI gpt-4o (FDA 21 CFR Part 820 expert
   prompt), inserts an `audit_findings` row, drafts a `capa_records` entry
   (`drafted_by: AuditAI`), and logs each step to `audit_log`:

   ```bash
   curl -X POST http://localhost:8000/api/detect
   ```

   Returns counts of batches scanned, deviations found, findings created,
   and CAPAs drafted.

4. **Review the finding + evidence package.** Includes the originating
   batch and the drafted CAPA:

   ```bash
   curl http://localhost:8000/api/findings
   curl http://localhost:8000/api/findings/1
   ```

5. **Inspect the drafted CAPA** (root cause, corrective action,
   regulatory reference):

   ```bash
   curl http://localhost:8000/api/capa/1
   ```

6. **Approve the CAPA.** Sets `approved_at` and `approved_by`, and advances
   the finding to `approved`:

   ```bash
   curl -X POST http://localhost:8000/api/capa/1/approve \
        -H "Content-Type: application/json" \
        -d '{"approved_by": "Jane Auditor"}'
   ```

7. **Review the full audit trail** — seeding, detection, drafting, and
   approval are all recorded:

   ```bash
   curl http://localhost:8000/api/audit-log
   ```

`POST /api/detect` is idempotent: re-running it will not create duplicate
findings for batches that already have one.
