import pytest
from app.database import SessionLocal
from app.api.paypal import (
    get_paypal_status,
    create_governed_paypal_order,
    PayPalOrderRequest
)
from app.models import AuditEvent

def test_paypal_status_endpoint():
    """Verifies the PayPal sandbox status endpoint returns accurate diagnostics."""
    data = get_paypal_status()
    assert data["integration"] == "PayPal Developer Sandbox"
    assert data["environment"] == "SANDBOX"
    assert data["governance_mode"] == "ZERO_TRUST_POLICY_GATED"
    assert "setup_guide_url" in data

def test_governed_paypal_order_allow_micropayment():
    """
    Evaluator Scenario: Low-value payment ($25.00) is evaluated by SentinelMesh.
    Policy: POL-PAYPAL-LOW -> ALLOW.
    Generates canonical RFC 8785 evidence and SHA-256 digest.
    """
    db = SessionLocal()
    try:
        req = PayPalOrderRequest(
            agent_id="agent-financial-bot",
            recipient="merchant-cloud-services@sandbox.paypal.com",
            amount=25.00,
            currency="USD",
            description="Monthly server hosting payment"
        )
        data = create_governed_paypal_order(req, db=db)
        assert data["decision"] == "ALLOW"
        assert data["policy_id"] == "POL-PAYPAL-LOW"
        assert data["event_id"].startswith("evt_")
        assert len(data["sha256_digest"]) == 64
    finally:
        db.close()

def test_governed_paypal_order_require_approval_high_value():
    """
    Evaluator Scenario: High-value payment ($1,500.00) exceeds $100 threshold.
    Policy: POL-PAYPAL-HIGH -> REQUIRE_APPROVAL.
    Halts execution and queues for human authorization.
    """
    db = SessionLocal()
    try:
        req = PayPalOrderRequest(
            agent_id="agent-financial-bot",
            recipient="vendor-equipment@sandbox.paypal.com",
            amount=1500.00,
            currency="USD",
            description="Hardware infrastructure purchase"
        )
        data = create_governed_paypal_order(req, db=db)
        assert data["decision"] == "REQUIRE_APPROVAL"
        assert data["policy_id"] == "POL-PAYPAL-HIGH"
        assert data["paypal_status"] == "HELD_PENDING_HUMAN_APPROVAL"
        assert "Authorize this payment in /approvals" in data["instruction"]

        event = db.query(AuditEvent).filter(AuditEvent.id == data["event_id"]).first()
        assert event is not None
        assert event.approval_status == "PENDING"
        assert event.execution_status == "PENDING_APPROVAL"
    finally:
        db.close()

def test_governed_paypal_order_blocked_sanctioned_entity():
    """
    Evaluator Scenario: Payment to blacklisted / sanctioned entity.
    Policy: POL-PAYPAL-BLOCKED -> BLOCK.
    Payment rejected before reaching PayPal API.
    """
    db = SessionLocal()
    try:
        req = PayPalOrderRequest(
            agent_id="agent-guest",
            recipient="sanctioned_entity",
            amount=50.00,
            currency="USD",
            description="Attempted payout to restricted entity"
        )
        data = create_governed_paypal_order(req, db=db)
        assert data["decision"] == "BLOCK"
        assert data["policy_id"] == "POL-PAYPAL-BLOCKED"
        assert data["paypal_status"] == "NOT_CALLED_POLICY_BLOCKED"
    finally:
        db.close()
