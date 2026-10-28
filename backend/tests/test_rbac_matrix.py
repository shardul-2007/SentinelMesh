import pytest
import uuid
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.database import SessionLocal, Base, engine
from app.models import User, SecurityPolicy, SecurityFinding
from app.schemas import (
    ActionEvaluateRequest,
    ApprovalDecisionRequest,
    SecurityPolicyCreateRequest,
    FindingStatusUpdateRequest,
    FindingStatusEnum
)
from app.api.actions import evaluate_action, check_action_submit_permission
from app.api.approvals import submit_approval_decision
from app.api.integrity import (
    simulate_tampering_for_demo,
    restore_tampered_event_for_demo
)
from app.api.policies import create_policy, toggle_policy_status
from app.api.threats import update_finding_status
from app.auth import create_access_token, require_roles
from app.seed import seed_database

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_database(session)
    yield session
    session.close()

@pytest.fixture(scope="module")
def users(db):
    admin = db.query(User).filter(User.username == "admin").first()
    analyst = db.query(User).filter(User.username == "analyst").first()
    viewer = db.query(User).filter(User.username == "viewer").first()
    return {"admin": admin, "analyst": analyst, "viewer": viewer}

def test_rbac_action_evaluation_permission(users):
    # 1. Compliance Auditor token is rejected with 403 Forbidden
    viewer_token = create_access_token({"username": users["viewer"].username, "role": "VIEWER"})
    cred_viewer = HTTPAuthorizationCredentials(scheme="Bearer", credentials=viewer_token)
    with pytest.raises(HTTPException) as exc_info:
        check_action_submit_permission(credentials=cred_viewer, db=None)
    assert exc_info.value.status_code == 403
    assert "Compliance Auditor" in exc_info.value.detail

    # 2. Security Analyst and Admin tokens pass cleanly
    analyst_token = create_access_token({"username": users["analyst"].username, "role": "SECURITY_ANALYST"})
    cred_analyst = HTTPAuthorizationCredentials(scheme="Bearer", credentials=analyst_token)
    check_action_submit_permission(credentials=cred_analyst, db=None)

    admin_token = create_access_token({"username": users["admin"].username, "role": "ADMIN"})
    cred_admin = HTTPAuthorizationCredentials(scheme="Bearer", credentials=admin_token)
    check_action_submit_permission(credentials=cred_admin, db=None)

def test_rbac_approvals_privilege(db, users):
    # 1. Create an action requiring approval
    req = ActionEvaluateRequest(
        agent_id="agent-compliance-checker",
        action_type="DELETE",
        resource="db://records/compliance_archive",
        reason="Testing approval permissions"
    )
    res = evaluate_action(req, db=db, _perm=None)
    event_id = res.event_id

    dec_req = ApprovalDecisionRequest(
        decision="APPROVED",
        approver_id="cso-admin",
        note="Approved for RBAC test"
    )

    # 2. Dependency checks
    checker = require_roles(["ADMIN"])

    # Analyst cannot approve
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=users["analyst"])
    assert exc_info.value.status_code == 403

    # Viewer cannot approve
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=users["viewer"])
    assert exc_info.value.status_code == 403

    # Admin successfully approves
    assert checker(current_user=users["admin"]) == users["admin"]
    approved = submit_approval_decision(event_id, dec_req, db=db, admin_user=users["admin"])
    assert approved.decision == "APPROVED"

def test_rbac_integrity_tamper_simulation_privilege(db, users):
    checker_admin_only = require_roles(["ADMIN"])

    # Analyst cannot simulate tamper
    with pytest.raises(HTTPException) as exc_info:
        checker_admin_only(current_user=users["analyst"])
    assert exc_info.value.status_code == 403

    # Viewer cannot simulate tamper
    with pytest.raises(HTTPException) as exc_info:
        checker_admin_only(current_user=users["viewer"])
    assert exc_info.value.status_code == 403

    # Admin can simulate tamper
    assert checker_admin_only(current_user=users["admin"]) == users["admin"]

def test_rbac_policy_management_privilege(db, users):
    checker = require_roles(["ADMIN"])

    # Analyst blocked with 403
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=users["analyst"])
    assert exc_info.value.status_code == 403

    # Viewer blocked with 403
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=users["viewer"])
    assert exc_info.value.status_code == 403

    # Admin creates policy
    test_pol_id = f"POL-TEST-RBAC-{uuid.uuid4().hex[:6]}"
    new_pol = SecurityPolicyCreateRequest(
        id=test_pol_id,
        name="RBAC Validation Policy",
        description="Verifies administrative policy authoring gate",
        action_pattern="EXECUTE",
        resource_pattern="sys://kernel/*",
        decision="BLOCK",
        risk_tier="CRITICAL"
    )
    created = create_policy(new_pol, db=db, admin_user=users["admin"])
    assert created.id == test_pol_id
    assert created.is_active is True

    # Admin toggles policy status
    toggled = toggle_policy_status(test_pol_id, db=db, admin_user=users["admin"])
    assert toggled.is_active is False

def test_rbac_threat_finding_resolution_privilege(db, users):
    # Fetch or create a finding
    finding = db.query(SecurityFinding).first()
    if not finding:
        finding = SecurityFinding(
            id="find_test_rbac",
            finding_id="FIND-RBAC-01",
            agent_id="agent-compliance-checker",
            rule_id="RULE-REP-BLK-01",
            rule_version="1.0.0",
            title="Test Finding for RBAC",
            description="RBAC finding test",
            severity="HIGH",
            status="ACTIVE"
        )
        db.add(finding)
        db.commit()

    # 1. Viewer is blocked with 403 Forbidden
    checker = require_roles(["ADMIN", "SECURITY_ANALYST"])
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=users["viewer"])
    assert exc_info.value.status_code == 403

    # 2. Analyst CAN investigate and update status
    investigate_payload = FindingStatusUpdateRequest(
        status=FindingStatusEnum.INVESTIGATING,
        notes="Analyst investigating active anomaly"
    )
    updated_inv = update_finding_status(finding.id, investigate_payload, current_user=users["analyst"], db=db)
    assert updated_inv["new_status"] == "INVESTIGATING"

    # 3. Admin CAN formally mark as RESOLVED
    admin_resolve_payload = FindingStatusUpdateRequest(
        status=FindingStatusEnum.RESOLVED,
        notes="Administrative formal sign-off committed by CSO"
    )
    updated_res = update_finding_status(finding.id, admin_resolve_payload, current_user=users["admin"], db=db)
    assert updated_res["new_status"] == "RESOLVED"
