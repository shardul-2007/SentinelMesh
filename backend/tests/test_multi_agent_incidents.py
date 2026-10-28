"""
Automated Unit and Integration Tests for Phase 7:
Multi-Agent Registry, Gateway Containment, Idempotency,
Incident Correlation, Controlled Response, and Real-Time Monitoring.
"""

import json
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import (
    User, Agent, AuditEvent, ActionRequest, IntegrityRecord, TamperAlert,
    SecurityFinding, FindingAuditLog, SecurityIncident, IncidentAuditLog, SecurityPolicy
)
from app.schemas import (
    AgentCreateRequest, AgentStatusUpdateRequest, AgentStatusEnum,
    ActionEvaluateRequest, IncidentStatusUpdateRequest, IncidentStatusEnum,
    IncidentQuarantineRequest
)
from app.api.agents import create_agent, update_agent_status, list_agents, get_agent
from app.api.actions import evaluate_action
from app.api.incidents import (
    list_incidents, get_incident_detail, update_incident_status,
    quarantine_incident_agent, get_incident_analytics
)
from app.incidents.correlator import IncidentCorrelator
from app.monitoring.events import EventBroadcaster
from fastapi import HTTPException


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed baseline policy
    pol = SecurityPolicy(
        id="POL-DEFAULT-ALLOW",
        name="Public Read Policy",
        description="Permits read actions",
        action_pattern="READ",
        resource_pattern="*",
        decision="ALLOW",
        risk_tier="LOW",
        version="1.0.0",
        is_active=True
    )
    session.add(pol)

    # Seed users
    admin = User(id="u_admin", username="admin", password_hash="fake", email="adm@mesh.loc", full_name="Admin", role="ADMIN")
    analyst = User(id="u_analyst", username="analyst", password_hash="fake", email="an@mesh.loc", full_name="Analyst", role="SECURITY_ANALYST")
    viewer = User(id="u_viewer", username="viewer", password_hash="fake", email="vi@mesh.loc", full_name="Viewer", role="VIEWER")
    session.add_all([admin, analyst, viewer])
    session.commit()

    yield session
    session.close()


def test_multi_agent_registration_and_uniqueness(test_db):
    admin = test_db.query(User).filter(User.username == "admin").first()

    # 1. Create first agent
    req1 = AgentCreateRequest(
        id="finance-bot-01",
        name="Finance Transfer Agent",
        role="FINANCE_BOT",
        description="Processes automated invoices",
        permissions=["FINANCE_READ", "FINANCE_SUBMIT"],
        assigned_policies=["POL-DEFAULT-ALLOW"]
    )
    agent1 = create_agent(req1, current_user=admin, db=test_db)
    assert agent1.id == "finance-bot-01"
    assert agent1.status == "ACTIVE"
    assert agent1.role == "FINANCE_BOT"

    # 2. Enforce uniqueness: duplicate registration must raise 409
    with pytest.raises(HTTPException) as exc_info:
        create_agent(req1, current_user=admin, db=test_db)
    assert exc_info.value.status_code == 409


def test_agent_containment_at_action_gateway(test_db):
    admin = test_db.query(User).filter(User.username == "admin").first()

    # Create agent
    req = AgentCreateRequest(
        id="rogue-bot-alpha",
        name="Suspicious Agent",
        role="BATCH_WORKER",
        permissions=["READ"]
    )
    create_agent(req, current_user=admin, db=test_db)

    # 1. Action allowed while ACTIVE
    action_req = ActionEvaluateRequest(
        agent_id="rogue-bot-alpha",
        action_type="READ",
        resource="public/docs"
    )
    res_active = evaluate_action(action_req, db=test_db)
    assert res_active.decision.value == "ALLOW"

    # 2. Contain/Deactivate agent
    update_agent_status("rogue-bot-alpha", AgentStatusUpdateRequest(status=AgentStatusEnum.QUARANTINED, reason="Operator containment"), current_user=admin, db=test_db)

    # 3. Action must be BLOCKED at gateway
    res_quarantined = evaluate_action(action_req, db=test_db)
    assert res_quarantined.decision.value == "BLOCK"
    assert "QUARANTINED" in res_quarantined.reason
    assert res_quarantined.policy_id == "POL-AGENT-CONTAINED"


def test_gateway_idempotency_control(test_db):
    idempotency_key = "idemp_trans_tx987654"

    req = ActionEvaluateRequest(
        agent_id="payment-agent-01",
        action_type="READ",
        resource="/api/balance",
        idempotency_key=idempotency_key
    )

    # First execution
    res1 = evaluate_action(req, db=test_db)
    assert res1.event_id is not None

    # Immediate retry with same idempotency key
    res2 = evaluate_action(req, db=test_db)
    assert res2.event_id == res1.event_id

    # Verify no duplicate events recorded
    event_count = test_db.query(AuditEvent).filter(AuditEvent.agent_id == "payment-agent-01").count()
    assert event_count == 1


def test_incident_correlation_and_deduplication(test_db):
    agent_id = "agent-incident-test"
    agent = Agent(id=agent_id, name="Test Agent", role="TESTER", status="ACTIVE")
    test_db.add(agent)
    test_db.commit()

    now = datetime.now(timezone.utc)

    # Add 2 active security findings for this agent
    f1 = SecurityFinding(
        id="fnd_1",
        finding_id="FIND-1",
        rule_id="RULE-REP-BLK-01",
        rule_version="1.0.0",
        agent_id=agent_id,
        severity="HIGH",
        status="ACTIVE",
        title="Repeated Blocked Actions",
        description="3 blocked operations detected",
        recommended_action="Quarantine",
        evidence_event_ids=json.dumps(["evt_1", "evt_2"]),
        dedup_key="dedup_f1",
        detected_at=now
    )
    f2 = SecurityFinding(
        id="fnd_2",
        finding_id="FIND-2",
        rule_id="RULE-HIGH-FREQ-02",
        rule_version="1.0.0",
        agent_id=agent_id,
        severity="MEDIUM",
        status="ACTIVE",
        title="Action Velocity Spike",
        description="Burst velocity",
        recommended_action="Throttle",
        evidence_event_ids=json.dumps(["evt_3", "evt_4"]),
        dedup_key="dedup_f2",
        detected_at=now
    )
    test_db.add_all([f1, f2])
    test_db.commit()

    correlator = IncidentCorrelator(test_db)
    incidents = correlator.run_correlation(agent_id=agent_id)

    # 1. Exactly 1 incident created grouping the 2 findings
    assert len(incidents) == 1
    inc = incidents[0]
    assert inc.agent_id == agent_id
    assert inc.status == "OPEN"
    assert inc.severity in ["HIGH", "CRITICAL"]
    f_ids = json.loads(inc.finding_ids)
    assert "fnd_1" in f_ids and "fnd_2" in f_ids

    # 2. Deduplication: running correlator again produces 0 duplicate incidents
    incidents_rerun = correlator.run_correlation(agent_id=agent_id)
    assert len(incidents_rerun) == 0

    total_incidents = test_db.query(SecurityIncident).filter(SecurityIncident.agent_id == agent_id).count()
    assert total_incidents == 1


def test_critical_finding_escalation(test_db):
    agent_id = "agent-crit-test"
    agent = Agent(id=agent_id, name="Critical Agent", role="CORE", status="ACTIVE")
    test_db.add(agent)
    test_db.commit()

    # Add 1 CRITICAL finding
    f_crit = SecurityFinding(
        id="fnd_crit",
        finding_id="FIND-CRIT-1",
        rule_id="RULE-INTEG-FAIL-06",
        rule_version="1.0.0",
        agent_id=agent_id,
        severity="CRITICAL",
        status="ACTIVE",
        title="Audit Evidence Tamper Alert",
        description="Cryptographic mismatch",
        recommended_action="Immediate forensic review",
        evidence_event_ids=json.dumps(["evt_tampered"]),
        dedup_key="dedup_crit",
        detected_at=datetime.now(timezone.utc)
    )
    test_db.add(f_crit)
    test_db.commit()

    correlator = IncidentCorrelator(test_db)
    incidents = correlator.run_correlation(agent_id=agent_id)

    assert len(incidents) == 1
    assert incidents[0].severity == "CRITICAL"
    assert "Critical" in incidents[0].title


def test_incident_response_quarantine_action(test_db):
    analyst = test_db.query(User).filter(User.username == "analyst").first()

    agent_id = "quarantine-target-agent"
    agent = Agent(id=agent_id, name="Target", role="WORKER", status="ACTIVE")
    test_db.add(agent)
    test_db.commit()

    inc = SecurityIncident(
        id="inc_test_contain",
        incident_id="INC-TEST-001",
        title="Test Incident",
        summary="Automated test incident",
        severity="HIGH",
        status="OPEN",
        agent_id=agent_id,
        correlation_rule="MANUAL_TEST",
        correlation_explanation="Test explanation",
        finding_ids="[]",
        evidence_event_ids="[]",
        dedup_key="dedup_contain_1"
    )
    test_db.add(inc)
    test_db.commit()

    # Operator executes quarantine action
    q_req = IncidentQuarantineRequest(reason="Compromised credentials detected")
    res = quarantine_incident_agent(inc.id, q_req, current_user=analyst, db=test_db)
    assert res["status"] == "AGENT_QUARANTINED"
    assert res["agent_id"] == agent_id

    # Verify agent state in database
    db_agent = test_db.query(Agent).filter(Agent.id == agent_id).first()
    assert db_agent.status == "QUARANTINED"

    # Verify incident audit log entry
    audit_log = test_db.query(IncidentAuditLog).filter(IncidentAuditLog.incident_id == inc.id).first()
    assert audit_log.action == "AGENT_QUARANTINED"
    assert audit_log.performed_by == "analyst"


def test_realtime_event_broadcaster():
    broadcaster = EventBroadcaster()
    queue = broadcaster.subscribe()

    # Publish an event
    broadcaster.publish_nowait("TEST_ALERT", {"status": "ALL_SYSTEMS_GO"})

    # Queue should receive the event immediately
    msg = queue.get_nowait()
    parsed = json.loads(msg)
    assert parsed["event_type"] == "TEST_ALERT"
    assert parsed["data"]["status"] == "ALL_SYSTEMS_GO"

    # Unsubscribe cleanly
    broadcaster.unsubscribe(queue)
    assert len(broadcaster._subscribers) == 0
