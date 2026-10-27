"""
Automated Unit and Integration Tests for Phase 6: Threat Detection,
Agent Trust Profiles, Explainable Risk Scorer, and Simulation Lab.
"""

import json
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import (
    User, Agent, AuditEvent, ActionRequest, IntegrityRecord, TamperAlert,
    SecurityFinding, FindingAuditLog, SecurityPolicy
)
from app.threats.rules import RULES_REGISTRY, get_registered_rules, get_rule_by_id
from app.threats.engine import ThreatDetectionEngine
from app.threats.risk_scorer import calculate_agent_risk_score
from app.threats.lab import ThreatSimulationLab, LAB_AGENT_ID
from app.api.threats import (
    list_detection_rules, list_findings, get_finding_detail,
    update_finding_status, list_agent_profiles, get_threat_analytics,
    run_lab_scenario, reset_lab
)
from app.schemas import FindingStatusUpdateRequest, FindingStatusEnum, LabScenarioRunRequest
from fastapi import HTTPException


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed baseline demo policies and agents
    pol = SecurityPolicy(
        id="POL-BLOCK-TEST",
        name="Block Test Policy",
        description="Test blocking policy",
        action_pattern="DELETE",
        resource_pattern="*",
        decision="BLOCK",
        risk_tier="HIGH",
        version="1.0.0",
        is_active=True
    )
    session.add(pol)

    agent = Agent(
        id="agent-threat-test",
        name="Test Threat Agent",
        role="SECURITY_TEST_PROBE",
        permissions="[]",
        status="ACTIVE"
    )
    session.add(agent)

    # Seed users
    admin_user = User(
        id="usr_admin",
        username="admin",
        password_hash="fake",
        email="admin@mesh.local",
        full_name="Admin User",
        role="ADMIN"
    )
    analyst_user = User(
        id="usr_analyst",
        username="analyst",
        password_hash="fake",
        email="analyst@mesh.local",
        full_name="Security Analyst",
        role="SECURITY_ANALYST"
    )
    viewer_user = User(
        id="usr_viewer",
        username="viewer",
        password_hash="fake",
        email="viewer@mesh.local",
        full_name="Viewer User",
        role="VIEWER"
    )
    session.add_all([admin_user, analyst_user, viewer_user])
    session.commit()

    yield session
    session.close()


def create_test_event(
    db,
    agent_id: str,
    action_type: str,
    resource: str,
    decision: str,
    policy_id: str = "POL-BLOCK-TEST",
    minutes_ago: int = 1
):
    ts = datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)
    evt_id = f"evt_test_{int(ts.timestamp())}_{action_type}_{resource.replace('/', '_')}"
    evt = AuditEvent(
        id=evt_id,
        timestamp=ts,
        agent_id=agent_id,
        action_type=action_type,
        resource=resource,
        policy_decision=decision,
        policy_id=policy_id,
        policy_version="1.0.0",
        reason="Automated test event",
        execution_mode="SIMULATED",
        execution_status="BLOCKED" if decision == "BLOCK" else "EXECUTED_SIMULATED",
        approval_status="NONE",
        integrity_hash="fake_hash_32_bytes_test"
    )
    db.add(evt)
    db.commit()
    return evt


def test_rule_registry_completeness():
    rules = get_registered_rules()
    assert len(rules) == 6
    expected_ids = [
        "RULE-REP-BLK-01",
        "RULE-HIGH-FREQ-02",
        "RULE-POL-VIOL-03",
        "RULE-REP-APPR-04",
        "RULE-SENS-ACT-05",
        "RULE-INTEG-FAIL-06"
    ]
    for rid in expected_ids:
        r = get_rule_by_id(rid)
        assert r is not None
        assert r.rule_id == rid
        assert r.severity in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert r.window_minutes > 0
        assert r.threshold >= 1
        assert len(r.recommended_action) > 10


def test_repeated_blocked_actions_rule(test_db):
    agent_id = "agent-threat-test"
    engine = ThreatDetectionEngine(test_db)

    # 1. Below threshold (2 blocked actions, threshold is 3)
    create_test_event(test_db, agent_id, "DELETE", "/db/table_1", "BLOCK", minutes_ago=2)
    create_test_event(test_db, agent_id, "DELETE", "/db/table_2", "BLOCK", minutes_ago=1)

    result_sub = engine.run_detection(agent_id=agent_id)
    assert result_sub["findings_generated"] == 0

    # 2. Add 3rd blocked action -> triggers RULE-REP-BLK-01
    create_test_event(test_db, agent_id, "DELETE", "/db/table_3", "BLOCK", minutes_ago=0)
    result_trigger = engine.run_detection(agent_id=agent_id)
    assert result_trigger["findings_generated"] == 1
    finding = result_trigger["findings"][0]
    assert finding.rule_id == "RULE-REP-BLK-01"
    assert finding.severity == "HIGH"
    assert finding.status == "ACTIVE"
    ev_ids = json.loads(finding.evidence_event_ids)
    assert len(ev_ids) == 3


def test_finding_deduplication_idempotency(test_db):
    agent_id = "agent-threat-test"
    engine = ThreatDetectionEngine(test_db)

    # Trigger rule
    for i in range(3):
        create_test_event(test_db, agent_id, "DELETE", f"/api/table_{i}", "BLOCK", minutes_ago=1)

    res1 = engine.run_detection(agent_id=agent_id)
    assert res1["findings_generated"] == 1

    # Re-run immediately: must be idempotent and generate 0 new duplicate findings
    res2 = engine.run_detection(agent_id=agent_id)
    assert res2["findings_generated"] == 0

    # Total in DB should still be exactly 1
    total = test_db.query(SecurityFinding).filter(SecurityFinding.agent_id == agent_id).count()
    assert total == 1


def test_velocity_burst_rule(test_db):
    agent_id = "agent-threat-test"
    engine = ThreatDetectionEngine(test_db)

    # Inject 8 rapid operations within 1 minute
    for i in range(8):
        create_test_event(test_db, agent_id, "READ", f"/metric_{i}", "ALLOW", minutes_ago=0)

    res = engine.run_detection(agent_id=agent_id)
    assert any(f.rule_id == "RULE-HIGH-FREQ-02" for f in res["findings"])


def test_sensitive_scope_rule(test_db):
    agent_id = "agent-threat-test"
    engine = ThreatDetectionEngine(test_db)

    # Critical resource targeting /etc/hosts
    create_test_event(test_db, agent_id, "READ", "/etc/credentials/vault.json", "ALLOW", minutes_ago=1)

    res = engine.run_detection(agent_id=agent_id)
    assert any(f.rule_id == "RULE-SENS-ACT-05" for f in res["findings"])
    sens_finding = next(f for f in res["findings"] if f.rule_id == "RULE-SENS-ACT-05")
    assert sens_finding.severity == "CRITICAL"


def test_risk_scorer_insufficient_data(test_db):
    agent_id = "agent-new"
    # Agent with 0 events
    score = calculate_agent_risk_score(test_db, agent_id)
    assert score["risk_score"] == 0
    assert score["risk_tier"] == "INSUFFICIENT_DATA"
    assert score["insufficient_data"] is True


def test_risk_scorer_deterministic_calculation(test_db):
    agent_id = "agent-threat-test"

    # Add 4 events: 2 ALLOW, 2 BLOCK
    create_test_event(test_db, agent_id, "READ", "/docs/1", "ALLOW", minutes_ago=10)
    create_test_event(test_db, agent_id, "READ", "/docs/2", "ALLOW", minutes_ago=8)
    create_test_event(test_db, agent_id, "DELETE", "/db/1", "BLOCK", minutes_ago=5)
    create_test_event(test_db, agent_id, "DELETE", "/db/2", "BLOCK", minutes_ago=2)

    score_1 = calculate_agent_risk_score(test_db, agent_id)
    score_2 = calculate_agent_risk_score(test_db, agent_id)

    # Determinism check
    assert score_1["risk_score"] == score_2["risk_score"]
    assert score_1["sample_size"] == 4
    assert score_1["insufficient_data"] is False
    assert len(score_1["factors"]) == 5
    assert score_1["risk_score"] > 0


def test_simulation_lab_negative_control(test_db):
    lab = ThreatSimulationLab(test_db)

    # Benign normal activity should trigger 0 findings
    res = lab.run_scenario("SCENARIO_NORMAL")
    assert res["actions_evaluated"] == 4
    assert res["findings_triggered"] == 0
    assert len(res["findings"]) == 0


def test_simulation_lab_repeated_blocked_scenario(test_db):
    lab = ThreatSimulationLab(test_db)

    res = lab.run_scenario("SCENARIO_REPEATED_BLOCKED")
    assert res["actions_evaluated"] == 3
    assert res["findings_triggered"] == 1
    assert res["findings"][0].rule_id == "RULE-REP-BLK-01"


def test_simulation_lab_reset(test_db):
    lab = ThreatSimulationLab(test_db)
    lab.run_scenario("SCENARIO_REPEATED_BLOCKED")

    # Confirm lab data exists
    sim_count = test_db.query(SecurityFinding).filter(SecurityFinding.is_simulation == True).count()
    assert sim_count >= 1

    # Reset
    lab.reset_lab_data()

    # Confirm lab data cleanly wiped
    sim_count_after = test_db.query(SecurityFinding).filter(SecurityFinding.is_simulation == True).count()
    assert sim_count_after == 0


def test_finding_status_workflow(test_db):
    analyst_user = test_db.query(User).filter(User.username == "analyst").first()

    # Trigger a finding
    agent_id = "agent-threat-test"
    for i in range(3):
        create_test_event(test_db, agent_id, "DELETE", f"/api/table_{i}", "BLOCK", minutes_ago=1)
    engine = ThreatDetectionEngine(test_db)
    engine.run_detection(agent_id=agent_id)

    finding = test_db.query(SecurityFinding).filter(SecurityFinding.agent_id == agent_id).first()
    assert finding is not None
    assert finding.status == "ACTIVE"

    # 1. Move to INVESTIGATING
    req_inv = FindingStatusUpdateRequest(status=FindingStatusEnum.INVESTIGATING, notes="Analyzing model tokens")
    res_inv = update_finding_status(finding.id, req_inv, current_user=analyst_user, db=test_db)
    assert res_inv["new_status"] == "INVESTIGATING"

    # 2. Move to RESOLVED
    req_res = FindingStatusUpdateRequest(status=FindingStatusEnum.RESOLVED, notes="Prompt template updated; quarantined")
    res_res = update_finding_status(finding.id, req_res, current_user=analyst_user, db=test_db)
    assert res_res["new_status"] == "RESOLVED"

    # Check audit logs
    detail = get_finding_detail(finding.id, current_user=analyst_user, db=test_db)
    assert len(detail.audit_logs) >= 3  # CREATED, STATUS_CHANGE to INVESTIGATING, STATUS_CHANGE to RESOLVED
