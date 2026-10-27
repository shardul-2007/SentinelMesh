import pytest
from datetime import datetime, timezone
from fastapi import HTTPException
from app.database import SessionLocal
from app.models import User, AuditEvent, ApprovalDecision
from app.schemas import ActionEvaluateRequest, ApprovalDecisionRequest
from app.api.actions import evaluate_action
from app.api.approvals import list_pending_approvals, submit_approval_decision
from app.api.events import get_event_detail
from app.auth import require_roles

def test_approval_auth_protection_and_workflow():
    db = SessionLocal()

    admin_user = db.query(User).filter(User.username == "admin").first()
    viewer_user = db.query(User).filter(User.username == "viewer").first()
    assert admin_user is not None
    assert viewer_user is not None

    # 1. Create an action that requires approval (e.g. database delete)
    req = ActionEvaluateRequest(
        agent_id="agent-financial-bot",
        action_type="DELETE",
        resource="db://financial/wire_transfers",
        reason="Requesting table wipeout"
    )
    eval_res = evaluate_action(req, db=db)
    assert eval_res.decision == "REQUIRE_APPROVAL"
    assert eval_res.execution_status == "PENDING_APPROVAL"
    event_id = eval_res.event_id

    # 2. Try to decide with non-admin (VIEWER) role -> RBAC raises 403 Forbidden
    checker = require_roles(["ADMIN"])
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=viewer_user)
    assert exc_info.value.status_code == 403

    # 3. Approve with authorized ADMIN user -> 200 OK
    decision_req = ApprovalDecisionRequest(
        decision="APPROVED",
        approver_id="security-lead",
        note="Verified during emergency protocol testing"
    )
    dec_res = submit_approval_decision(
        event_id=event_id,
        payload=decision_req,
        db=db,
        admin_user=admin_user
    )
    assert dec_res.decision == "APPROVED"
    assert dec_res.execution_status == "APPROVED_SIMULATED"  # Safety rule: simulated execution!

    # 4. Verify the event detail reflects approval status
    detail = get_event_detail(event_id=event_id, db=db)
    assert detail.approval_status == "APPROVED"
    assert detail.execution_status == "APPROVED_SIMULATED"
    assert detail.approval_decision is not None
    assert detail.approval_decision["approver_id"] == "security-lead"

    # 5. Try to re-decide already finalized event -> 400 Bad Request
    with pytest.raises(HTTPException) as redecide_err:
        submit_approval_decision(
            event_id=event_id,
            payload=ApprovalDecisionRequest(decision="REJECTED", approver_id="security-lead"),
            db=db,
            admin_user=admin_user
        )
    assert redecide_err.value.status_code == 400
    assert "already finalized" in redecide_err.value.detail

    db.close()
