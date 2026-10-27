import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.api import (
    dashboard_router,
    events_router,
    actions_router,
    policies_router,
    approvals_router,
    integrity_router,
    auth_router,
    reports_router,
    threats_router,
    agents_router,
    incidents_router,
    monitoring_router,
    governance_router
)
from app.blockchain.service import get_blockchain_service
from app.models import AuditEvent, IntegrityRecord
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex, CANONICAL_VERSION, HASH_ALGORITHM

def ensure_integrity_records_migrated(db: SessionLocal):
    """
    Safe initialization & migration path preserving Phase 1 records:
    Automatically generates an IntegrityRecord for any pre-existing AuditEvent.
    """
    events = db.query(AuditEvent).all()
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    for evt in events:
        existing_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == evt.id).first()
        if not existing_rec:
            # Deterministic canonical hash
            calc_hash = hash_to_bytes32_hex(compute_canonical_event_hash(
                event_id=evt.id,
                timestamp=evt.timestamp,
                agent_id=evt.agent_id,
                action_type=evt.action_type,
                resource=evt.resource,
                policy_decision=evt.policy_decision,
                policy_id=evt.policy_id,
                policy_version=evt.policy_version,
                reason=evt.reason,
                execution_mode=evt.execution_mode
            ))
            new_rec = IntegrityRecord(
                id=f"int_{evt.id}",
                event_id=evt.id,
                hash_algorithm=HASH_ALGORITHM,
                canonical_version=CANONICAL_VERSION,
                event_hash=calc_hash,
                anchoring_status="NOT_ANCHORED",
                verification_status="INTACT",
                last_verified_at=now_utc
            )
            db.add(new_rec)
    db.commit()

def ensure_sqlite_columns_migrated(db: SessionLocal):
    """Safe SQLite migration ensuring Phase 7 Agent fields exist."""
    try:
        from sqlalchemy import text
        existing_cols = [row[1] for row in db.execute(text("PRAGMA table_info(agents)")).fetchall()]
        if "description" not in existing_cols:
            db.execute(text("ALTER TABLE agents ADD COLUMN description TEXT"))
        if "assigned_policies" not in existing_cols:
            db.execute(text("ALTER TABLE agents ADD COLUMN assigned_policies TEXT DEFAULT '[]'"))
        if "last_active_at" not in existing_cols:
            db.execute(text("ALTER TABLE agents ADD COLUMN last_active_at DATETIME"))
        db.commit()
    except Exception:
        pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created and seed policies/agents
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_sqlite_columns_migrated(db)
        seed_database(db)
        ensure_integrity_records_migrated(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="SentinelMesh API",
    description="Security & Accountability Policy Engine for Autonomous AI Agents (Phase 2 Blockchain Anchoring)",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["System"])
def health_check():
    b_service = get_blockchain_service()
    b_status = b_service.get_status()

    return {
        "status": "healthy",
        "service": "SentinelMesh Policy & Integrity Engine",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "database": "CONNECTED",
        "blockchain_integration": {
            "status": "CONNECTED" if b_status["connected"] else "NOT CONNECTED",
            "mode": b_status["mode"],
            "connected": b_status["connected"],
            "network": b_status["network_name"],
            "chain_id": b_status["configured_chain_id"],
            "contract_address": b_status["contract_address"],
            "has_contract": b_status["has_contract"],
            "description": b_status["description"]
        }
    }

# Register API routers
app.include_router(dashboard_router)
app.include_router(events_router)
app.include_router(actions_router)
app.include_router(policies_router)
app.include_router(approvals_router)
app.include_router(integrity_router)
app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(threats_router)
app.include_router(agents_router)
app.include_router(incidents_router)
app.include_router(monitoring_router)
app.include_router(governance_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
