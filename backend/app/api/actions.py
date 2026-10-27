import uuid
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Agent, ActionRequest, AuditEvent, IntegrityRecord
from app.schemas import ActionEvaluateRequest, ActionEvaluateResponse
from app.policy_engine.evaluator import PolicyEvaluator
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex, CANONICAL_VERSION, HASH_ALGORITHM

router = APIRouter(prefix="/api/actions", tags=["Actions"])

@router.post("/evaluate", response_model=ActionEvaluateResponse)
def evaluate_action(
    req: ActionEvaluateRequest,
    db: Session = Depends(get_db)
):
    # 1. Lookup agent and permissions if exists, otherwise register or default
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    agent_perms = []
    if agent and agent.permissions:
        try:
            agent_perms = json.loads(agent.permissions)
        except Exception:
            agent_perms = []

    # 2. Evaluate using PolicyEvaluator (Client-supplied risk level is discarded)
    result = PolicyEvaluator.evaluate(
        agent_id=req.agent_id,
        action_type=req.action_type,
        resource=req.resource,
        agent_permissions=agent_perms
    )

    # 3. Cryptographic Chain link: Find previous event's integrity hash
    last_event = db.query(AuditEvent).order_by(desc(AuditEvent.timestamp)).first()
    previous_hash = last_event.integrity_hash if last_event else "GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000"

    # 4. Generate unique IDs and timestamps
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    now_utc = datetime.datetime.utcnow()

    # 5. Compute SHA-256 integrity hash
    integrity_hash = PolicyEvaluator.compute_integrity_hash(
        event_id=event_id,
        timestamp_iso=now_utc.isoformat(),
        agent_id=req.agent_id,
        action_type=req.action_type,
        resource=req.resource,
        decision=result.decision.value,
        policy_id=result.policy_id,
        previous_event_hash=previous_hash
    )

    # 6. Persist ActionRequest
    action_req_record = ActionRequest(
        id=request_id,
        agent_id=req.agent_id,
        action_type=req.action_type,
        resource=req.resource,
        client_risk_level=req.client_risk_level,
        derived_risk_level=result.derived_risk_level.value,
        reason=req.reason,
        parameters=json.dumps(req.parameters or {}),
        created_at=now_utc
    )
    db.add(action_req_record)

    # Ensure agent exists in database
    if not agent:
        new_agent = Agent(
            id=req.agent_id,
            name=req.agent_id,
            role="Dynamically Registered Agent",
            permissions="[]",
            status="ACTIVE",
            created_at=now_utc
        )
        db.add(new_agent)

    # 7. Persist AuditEvent (Append-only)
    event_metadata = {
        "client_supplied_risk": req.client_risk_level,
        "derived_risk_level": result.derived_risk_level.value,
        "request_parameters": req.parameters or {},
        "simulation_disclaimer": "Phase 1 MVP: Execution is strictly simulated. Blocked and pending actions are never executed.",
        "blockchain_readiness": {
            "status": "PREPARED_PHASE2",
            "hash_algorithm": "SHA-256",
            "previous_hash": previous_hash
        }
    }

    audit_event = AuditEvent(
        id=event_id,
        request_id=request_id,
        timestamp=now_utc,
        agent_id=req.agent_id,
        action_type=req.action_type,
        resource=req.resource,
        policy_decision=result.decision.value,
        policy_id=result.policy_id,
        policy_version=result.policy_version,
        reason=result.reason,
        execution_mode="SIMULATED",
        execution_status=result.execution_status.value,
        approval_status=result.approval_status,
        event_metadata=json.dumps(event_metadata),
        integrity_hash=integrity_hash,
        previous_event_hash=previous_hash
    )
    db.add(audit_event)

    # Compute deterministic canonical hash for Phase 2 integrity tracking
    canonical_hash = hash_to_bytes32_hex(compute_canonical_event_hash(
        event_id=event_id,
        timestamp=now_utc,
        agent_id=req.agent_id,
        action_type=req.action_type,
        resource=req.resource,
        policy_decision=result.decision.value,
        policy_id=result.policy_id,
        policy_version=result.policy_version,
        reason=result.reason,
        execution_mode="SIMULATED",
        parameters=req.parameters
    ))

    integrity_record = IntegrityRecord(
        id=f"int_{event_id}",
        event_id=event_id,
        hash_algorithm=HASH_ALGORITHM,
        canonical_version=CANONICAL_VERSION,
        event_hash=canonical_hash,
        anchoring_status="NOT_ANCHORED",
        verification_status="INTACT",
        last_verified_at=now_utc
    )
    db.add(integrity_record)

    db.commit()
    db.refresh(audit_event)

    return ActionEvaluateResponse(
        event_id=event_id,
        decision=result.decision,
        policy_id=result.policy_id,
        policy_name=result.policy_name,
        reason=result.reason,
        derived_risk_level=result.derived_risk_level,
        execution_mode="SIMULATED",
        execution_status=result.execution_status,
        approval_status=result.approval_status,
        timestamp=now_utc,
        integrity_hash=integrity_hash,
        previous_event_hash=previous_hash
    )
