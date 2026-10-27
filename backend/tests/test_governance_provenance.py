"""
Automated Unit and Integration Tests for Phase 8:
Autonomous Security Governance, Traceable Evidence Provenance,
Policy Versioning, Approval Separation of Duties, and CSV Sanitization.
"""

import json
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import (
    User, Agent, AuditEvent, ActionRequest, IntegrityRecord,
    SecurityPolicy, PolicyVersionHistory, ApprovalDecision
)
from app.schemas import (
    ActionEvaluateRequest, ApprovalDecisionRequest, PolicyUpdateRequest,
    PolicyDecisionEnum, RiskTierEnum
)
from app.api.actions import evaluate_action
from app.api.approvals import submit_approval_decision
from app.api.governance import (
    explain_governance_decision, get_policy_version_history,
    update_policy_version, sanitize_csv_cell, get_governance_overview
)
from app.governance.provenance import GovernanceProvenanceService
from fastapi import HTTPException


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed baseline policy
    pol = SecurityPolicy(
        id="POL-PUBLIC-READ",
        name="Public Read Policy",
        description="Permits read actions on public resources",
        action_pattern="READ",
        resource_pattern="public/*",
        decision="ALLOW",
        risk_tier="LOW",
        version="1.0.0",
        is_active=True
    )
    pol_appr = SecurityPolicy(
        id="POL-EXPORT-DATA",
        name="Customer Data Export",
        description="Requires administrative approval",
        action_pattern="EXPORT",
        resource_pattern="customer/*",
        decision="REQUIRE_APPROVAL",
        risk_tier="HIGH",
        version="1.0.0",
        is_active=True
    )
    session.add_all([pol, pol_appr])

    # Seed users
    admin = User(id="u_admin", username="admin", password_hash="fake", email="adm@mesh.loc", full_name="Admin", role="ADMIN")
    agent_user = User(id="u_agent", username="data-agent-01", password_hash="fake", email="agent@mesh.loc", full_name="Data Agent", role="ADMIN")
    session.add_all([admin, agent_user])
    session.commit()

    yield session
    session.close()


def test_provenance_chain_resolution(test_db):
    # 1. Run action evaluation through gateway
    req = ActionEvaluateRequest(
        agent_id="data-agent-01",
        action_type="READ",
        resource="public/dataset.parquet",
        parameters={"limit": 50}
    )
    res = evaluate_action(req, db=test_db)
    assert res.decision.value == "ALLOW"

    # 2. Resolve provenance chain
    prov_service = GovernanceProvenanceService(test_db)
    explanation = prov_service.explain_event(res.event_id)

    assert explanation is not None
    assert explanation.event_id == res.event_id
    assert explanation.action_type == "READ"
    assert explanation.resource == "public/dataset.parquet"
    assert explanation.policy_decision == "ALLOW"
    assert explanation.local_verification_status == "INTACT"
    assert explanation.provenance_chain_complete is True
    assert "Cryptographic provenance" in explanation.provenance_disclaimer


def test_tampering_detected_in_provenance_explanation(test_db):
    req = ActionEvaluateRequest(
        agent_id="data-agent-01",
        action_type="READ",
        resource="public/dataset.parquet"
    )
    res = evaluate_action(req, db=test_db)

    # Maliciously mutate the audit event directly in the database
    evt = test_db.query(AuditEvent).filter(AuditEvent.id == res.event_id).first()
    evt.resource = "public/tampered_unauthorized_dataset.parquet"
    test_db.commit()

    # Re-evaluate provenance
    prov_service = GovernanceProvenanceService(test_db)
    explanation = prov_service.explain_event(res.event_id)

    assert explanation is not None
    assert explanation.local_verification_status == "TAMPERED"
    assert explanation.provenance_chain_complete is False


def test_separation_of_duties_prevents_self_approval(test_db):
    # Evaluates approval-required action
    req = ActionEvaluateRequest(
        agent_id="data-agent-01",
        action_type="EXPORT",
        resource="customer/pii_records.csv"
    )
    res = evaluate_action(req, db=test_db)
    assert res.decision.value == "REQUIRE_APPROVAL"

    # User whose username is 'data-agent-01' attempts to approve their own action
    self_user = test_db.query(User).filter(User.username == "data-agent-01").first()
    appr_payload = ApprovalDecisionRequest(decision="APPROVED", approver_id="data-agent-01")

    with pytest.raises(HTTPException) as exc_info:
        submit_approval_decision(res.event_id, appr_payload, db=test_db, admin_user=self_user)

    assert exc_info.value.status_code == 403
    assert "Separation of duties violation" in exc_info.value.detail


def test_duplicate_approval_decision_rejected(test_db):
    req = ActionEvaluateRequest(
        agent_id="finance-bot",
        action_type="EXPORT",
        resource="customer/pii_records.csv"
    )
    res = evaluate_action(req, db=test_db)
    admin = test_db.query(User).filter(User.username == "admin").first()

    appr_payload = ApprovalDecisionRequest(decision="APPROVED", approver_id="admin", note="First approval")
    res1 = submit_approval_decision(res.event_id, appr_payload, db=test_db, admin_user=admin)
    assert res1.status == "APPROVED"

    # Second approval attempt must raise 400 or 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        submit_approval_decision(res.event_id, appr_payload, db=test_db, admin_user=admin)

    assert exc_info.value.status_code in [400, 409]
    assert "Duplicate decision rejected" in exc_info.value.detail


def test_policy_versioning_and_provenance(test_db):
    admin = test_db.query(User).filter(User.username == "admin").first()

    # 1. Update policy
    update_req = PolicyUpdateRequest(
        name="Updated Public Read Policy",
        description="Expanded public policy with new rate limits",
        decision=PolicyDecisionEnum.ALLOW,
        risk_tier=RiskTierEnum.LOW,
        change_reason="Quarterly policy review and compliance alignment"
    )
    hist_entry = update_policy_version("POL-PUBLIC-READ", update_req, current_user=admin, db=test_db)

    assert hist_entry.policy_id == "POL-PUBLIC-READ"
    assert hist_entry.version == "1.0.0"
    assert hist_entry.changed_by == "admin"

    # 2. Verify active policy has bumped version
    active_pol = test_db.query(SecurityPolicy).filter(SecurityPolicy.id == "POL-PUBLIC-READ").first()
    assert active_pol.version == "1.0.1"

    # 3. Retrieve version history
    history = get_policy_version_history("POL-PUBLIC-READ", current_user=admin, db=test_db)
    assert len(history) == 1
    assert history[0].version == "1.0.0"


def test_csv_injection_neutralization():
    # Dangerous spreadsheet formulas
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-123") == "'-123"
    assert sanitize_csv_cell("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    # Safe text
    assert sanitize_csv_cell("SAFE_EVENT_ID_123") == "SAFE_EVENT_ID_123"
    assert sanitize_csv_cell("") == ""
