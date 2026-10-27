import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.config import settings
from app.models import AuditEvent, ApprovalDecision, User
from app.auth import require_roles
from app.monitoring.events import get_broadcaster
from app.schemas import (
    AuditEventSummary,
    ApprovalDecisionRequest,
    ApprovalDecisionResponse
)

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

@router.get("", response_model=List[AuditEventSummary])
def list_pending_approvals(db: Session = Depends(get_db)):
    """List all actions requiring approval."""
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.policy_decision == "REQUIRE_APPROVAL")
        .order_by(AuditEvent.timestamp.desc())
        .all()
    )
    return [AuditEventSummary.model_validate(e) for e in events]

@router.post("/{event_id}/decision", response_model=ApprovalDecisionResponse)
def submit_approval_decision(
    event_id: str,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Authorized endpoint to approve or reject pending AI action requests.
    Enforces Phase 1 simulation safety: approved actions execute only in SIMULATED mode.
    """
    event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Audit event '{event_id}' not found.")

    if event.policy_decision != "REQUIRE_APPROVAL":
        raise HTTPException(
            status_code=400,
            detail=f"Event '{event_id}' has decision '{event.policy_decision}' and does not require approval."
        )

    # 1. Separation of duties: requester cannot approve their own action
    if admin_user.username.lower() == event.agent_id.lower() or (payload.approver_id and payload.approver_id.lower() == event.agent_id.lower()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Separation of duties violation: Requester '{event.agent_id}' cannot approve its own action."
        )

    # 2. Reject duplicate / conflicting decisions
    if event.approval_status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate decision rejected: Event '{event_id}' is already finalized as '{event.approval_status}'."
        )

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    decision_id = f"dec_{uuid.uuid4().hex[:12]}"

    approval_record = ApprovalDecision(
        id=decision_id,
        event_id=event.id,
        decision=payload.decision,
        approver_id=payload.approver_id,
        note=payload.note,
        decided_at=now_utc
    )
    db.add(approval_record)

    # Update event state
    event.approval_status = payload.decision
    if payload.decision == "APPROVED":
        # Crucial safety requirement: Phase 1 execution remains simulated!
        event.execution_status = "APPROVED_SIMULATED"
        msg = f"Request '{event_id}' was approved by '{payload.approver_id}'. Operation marked as APPROVED_SIMULATED (simulated execution only)."
    else:
        event.execution_status = "REJECTED"
        msg = f"Request '{event_id}' was rejected by '{payload.approver_id}'. Operation remained unexecuted."

    db.commit()
    db.refresh(event)

    get_broadcaster().publish_nowait("APPROVAL_DECIDED", {
        "event_id": event.id,
        "decision": payload.decision,
        "approver_id": payload.approver_id,
        "execution_status": event.execution_status
    })

    return ApprovalDecisionResponse(
        event_id=event.id,
        status=event.approval_status,
        execution_status=event.execution_status,
        decision=payload.decision,
        approver_id=payload.approver_id,
        decided_at=now_utc,
        integrity_hash=event.integrity_hash,
        message=msg
    )
