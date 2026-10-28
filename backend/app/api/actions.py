import uuid
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Agent, ActionRequest, AuditEvent, IntegrityRecord
from app.schemas import ActionEvaluateRequest, ActionEvaluateResponse, PolicyDecisionEnum, ExecutionStatusEnum, RiskTierEnum
from app.policy_engine.evaluator import PolicyEvaluator, EvaluationResult
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex, CANONICAL_VERSION, HASH_ALGORITHM
from app.monitoring.events import get_broadcaster
from app.threats.engine import ThreatDetectionEngine
from app.incidents.correlator import IncidentCorrelator

router = APIRouter(prefix="/api/actions", tags=["Actions"])

@router.post("/evaluate", response_model=ActionEvaluateResponse)
def evaluate_action(
    req: ActionEvaluateRequest,
    db: Session = Depends(get_db)
):
    # 0. Idempotency check: if client supplied an idempotency_key, check for existing request
    if req.idempotency_key:
        cached_req = db.query(ActionRequest).filter(
            ActionRequest.id == f"req_idem_{req.idempotency_key}"
        ).first()
        if cached_req and cached_req.audit_event:
            evt = cached_req.audit_event
            return ActionEvaluateResponse(
                event_id=evt.id,
                decision=PolicyDecisionEnum(evt.policy_decision),
                policy_id=evt.policy_id,
                policy_name=evt.policy_id,
                reason=evt.reason,
                derived_risk_level=RiskTierEnum(cached_req.derived_risk_level),
                execution_mode=evt.execution_mode,
                execution_status=ExecutionStatusEnum(evt.execution_status),
                approval_status=evt.approval_status,
                timestamp=evt.timestamp,
                integrity_hash=evt.integrity_hash,
                previous_event_hash=evt.previous_event_hash
            )

    # 1. Lookup agent and operational status
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    now_utc = datetime.datetime.now(datetime.timezone.utc)

    # CRITICAL: Enforce containment check. Inactive or quarantined agents cannot execute actions.
    if agent and agent.status in ["DEACTIVATED", "QUARANTINED"]:
        decision = PolicyDecisionEnum.BLOCK
        policy_id = "POL-AGENT-CONTAINED"
        policy_name = f"Agent Contained ({agent.status})"
        reason = f"Gateway containment enforced: Agent '{agent.id}' is {agent.status} and forbidden from executing actions."
        derived_risk = RiskTierEnum.CRITICAL
        exec_status = ExecutionStatusEnum.BLOCKED
        approval_status = "NONE"
        result = EvaluationResult(
            decision=decision,
            policy_id=policy_id,
            policy_name=policy_name,
            reason=reason,
            derived_risk_level=derived_risk,
            execution_status=exec_status,
            approval_status=approval_status,
            policy_version="1.0.0"
        )
    else:
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
    if req.idempotency_key:
        request_id = f"req_idem_{req.idempotency_key}"
    else:
        request_id = f"req_{uuid.uuid4().hex[:12]}"
    event_id = f"evt_{uuid.uuid4().hex[:12]}"

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

    # Ensure agent exists in database and update last_active_at
    if not agent:
        agent = Agent(
            id=req.agent_id,
            name=req.agent_id,
            role="Dynamically Registered Agent",
            permissions="[]",
            assigned_policies="[]",
            status="ACTIVE",
            created_at=now_utc,
            last_active_at=now_utc
        )
        db.add(agent)
    else:
        agent.last_active_at = now_utc

    # 7. Persist AuditEvent (Append-only)
    event_metadata = {
        "client_supplied_risk": req.client_risk_level,
        "derived_risk_level": result.derived_risk_level.value,
        "request_parameters": req.parameters or {},
        "idempotency_key": req.idempotency_key,
        "execution_boundary": "Isolated execution. Blocked and pending actions are strictly prevented from execution.",
        "blockchain_readiness": {
            "status": "PREPARED_FOR_ANCHORING",
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

    # 8. Broadcast real-time event to SSE monitoring stream
    get_broadcaster().publish_nowait("ACTION_EVALUATED", {
        "event_id": event_id,
        "agent_id": req.agent_id,
        "action_type": req.action_type,
        "resource": req.resource,
        "decision": result.decision.value,
        "risk_tier": result.derived_risk_level.value,
        "timestamp": now_utc.isoformat()
    })

    # 9. Asynchronously run behavioral detection and incident correlation
    try:
        engine = ThreatDetectionEngine(db)
        engine.run_detection(agent_id=req.agent_id, triggered_by="GATEWAY_ACTION")
        correlator = IncidentCorrelator(db)
        correlator.run_correlation(agent_id=req.agent_id)
    except Exception:
        # Failure in threat detection/incident analysis does not abort the audit event
        pass

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
