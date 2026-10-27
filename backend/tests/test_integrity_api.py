import pytest
from fastapi import HTTPException
from app.database import SessionLocal
from app.models import User, AuditEvent, IntegrityRecord
from app.schemas import ActionEvaluateRequest
from app.api.actions import evaluate_action
from app.api.integrity import (
    get_integrity_record,
    generate_or_recompute_hash,
    get_blockchain_status,
    list_integrity_records,
    list_tamper_alerts,
    simulate_tampering_for_demo,
    restore_tampered_event_for_demo,
    anchor_event_to_blockchain
)
from app.auth import require_roles

def test_integrity_hash_and_get_endpoints():
    db = SessionLocal()

    # 1. Create action
    req = ActionEvaluateRequest(
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/quarterly_kpis.pdf",
        reason="Auditing KPIs"
    )
    eval_res = evaluate_action(req, db=db)
    event_id = eval_res.event_id

    # 2. Get integrity record
    int_rec = get_integrity_record(event_id=event_id, db=db)
    assert int_rec.event_id == event_id
    assert int_rec.hash_algorithm == "SHA-256"
    assert int_rec.event_hash.startswith("0x")
    assert int_rec.anchoring_status == "NOT_ANCHORED"

    # 3. Recalculate hash endpoint
    recalc_res = generate_or_recompute_hash(event_id=event_id, db=db)
    assert recalc_res["event_hash"] == int_rec.event_hash

    db.close()

def test_integrity_status_endpoint():
    db = SessionLocal()
    status_data = get_blockchain_status(db=db)
    assert status_data.mode in ["LOCAL_DEVELOPMENT", "CONNECTED", "DISCONNECTED"]
    assert hasattr(status_data, "total_anchors")
    assert hasattr(status_data, "total_verified")
    assert hasattr(status_data, "total_tampered")
    db.close()

def test_anchor_auth_protection():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.username == "admin").first()
    viewer_user = db.query(User).filter(User.username == "viewer").first()

    req = ActionEvaluateRequest(
        agent_id="agent-devops-orchestrator",
        action_type="UPDATE",
        resource="db://analytics/records",
        reason="Test anchor authorization"
    )
    eval_res = evaluate_action(req, db=db)
    event_id = eval_res.event_id

    # Viewer role is denied with 403 Forbidden
    checker = require_roles(["ADMIN"])
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=viewer_user)
    assert exc_info.value.status_code == 403

    # Admin passes auth check
    assert checker(current_user=admin_user) == admin_user

    db.close()

def test_list_integrity_records_and_alerts():
    db = SessionLocal()
    records = list_integrity_records(page=1, page_size=10, db=db)
    assert isinstance(records, list)
    assert len(records) >= 1

    alerts = list_tamper_alerts(db=db)
    assert isinstance(alerts, list)
    db.close()

def test_simulate_and_restore_tamper_endpoints():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.username == "admin").first()

    # Simulate tampering on a demo record
    sim_res = simulate_tampering_for_demo(payload=None, db=db, user=admin_user)
    assert sim_res["status"] == "TAMPER_SIMULATED"
    assert sim_res["verification_result"]["status"] == "TAMPERED"

    # Restore the tampered demo record
    rest_res = restore_tampered_event_for_demo(event_id=sim_res["event_id"], db=db, user=admin_user)
    assert rest_res["status"] == "RESTORED"
    assert rest_res["restored_records_count"] >= 1

    db.close()
