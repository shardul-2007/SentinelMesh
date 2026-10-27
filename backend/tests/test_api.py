import pytest
from app.database import SessionLocal
from app.main import health_check
from app.api.policies import get_policies
from app.api.actions import evaluate_action
from app.api.dashboard import get_dashboard_stats
from app.api.events import list_events, get_event_detail
from app.schemas import ActionEvaluateRequest

def test_health_endpoint():
    data = health_check()
    assert data["status"] == "healthy"
    assert data["database"] == "CONNECTED"
    assert data["blockchain_integration"]["status"] in ["CONNECTED", "NOT CONNECTED"]

def test_get_policies():
    db = SessionLocal()
    policies = get_policies(db=db)
    assert len(policies) >= 7
    ids = [p.id for p in policies]
    for expected_id in ["POL-A", "POL-B", "POL-C", "POL-D", "POL-E", "POL-F", "POL-G"]:
        assert expected_id in ids
    db.close()

def test_action_evaluate_allow_flow():
    db = SessionLocal()
    payload = ActionEvaluateRequest(
        agent_id="agent-test-worker",
        action_type="READ",
        resource="public/system_metrics.json",
        client_risk_level="CRITICAL",  # Untrusted client input!
        reason="Auditing public metrics"
    )
    data = evaluate_action(payload, db=db)
    assert data.decision == "ALLOW"
    assert data.policy_id == "POL-A"
    assert data.derived_risk_level == "LOW"  # Server correctly derived LOW, ignored CRITICAL
    assert data.execution_status == "EXECUTED_SIMULATED"
    assert data.execution_mode == "SIMULATED"
    assert "evt_" in data.event_id
    assert len(data.integrity_hash) == 64
    db.close()

def test_action_evaluate_block_flow():
    db = SessionLocal()
    payload = ActionEvaluateRequest(
        agent_id="agent-guest",
        action_type="READ",
        resource="restricted/corporate_passwords.txt",
        client_risk_level="LOW",
        reason="Attempting unauthorized read"
    )
    data = evaluate_action(payload, db=db)
    assert data.decision == "BLOCK"
    assert data.policy_id == "POL-B"
    assert data.execution_status == "BLOCKED"
    assert data.approval_status == "NONE"
    db.close()

def test_action_evaluate_approval_required_flow():
    db = SessionLocal()
    payload = ActionEvaluateRequest(
        agent_id="agent-data-analyzer",
        action_type="DELETE",
        resource="db://analytics/events_2025",
        reason="Purging old records"
    )
    data = evaluate_action(payload, db=db)
    assert data.decision == "REQUIRE_APPROVAL"
    assert data.policy_id == "POL-D"
    assert data.execution_status == "PENDING_APPROVAL"
    assert data.approval_status == "PENDING"
    db.close()

def test_dashboard_stats_and_event_persistence():
    db = SessionLocal()

    # Fetch stats
    stats = get_dashboard_stats(db=db)
    assert stats.total_events > 0
    assert hasattr(stats, "allowed_count")
    assert hasattr(stats, "blocked_count")
    assert hasattr(stats, "pending_approvals_count")

    # Fetch events list
    events_data = list_events(page=1, page_size=10, db=db)
    assert events_data.total >= 1
    assert len(events_data.events) > 0

    # Fetch single event detail
    first_event_id = events_data.events[0].id
    detail = get_event_detail(event_id=first_event_id, db=db)
    assert detail.id == first_event_id
    assert hasattr(detail, "integrity_hash")
    assert hasattr(detail, "execution_mode")

    db.close()
