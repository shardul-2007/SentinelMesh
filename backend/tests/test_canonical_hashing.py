import pytest
from datetime import datetime, timezone, timedelta
from app.integrity.canonical import (
    CanonicalAuditEvent,
    compute_canonical_event_hash,
    hash_to_bytes32_hex,
    normalize_utc_timestamp,
    CANONICAL_VERSION
)

def test_deterministic_canonicalization():
    ts = "2026-10-27T12:00:00.000000Z"
    h1 = compute_canonical_event_hash(
        event_id="evt_test_100",
        timestamp=ts,
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/financial_report.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason="Routine auditing",
        execution_mode="SIMULATED",
        parameters={"format": "pdf", "limit": 10}
    )

    h2 = compute_canonical_event_hash(
        event_id="evt_test_100",
        timestamp=ts,
        agent_id="agent-data-analyzer",
        action_type="read",  # Lowercase normalized to uppercase READ
        resource="public/financial_report.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason="Routine auditing",
        execution_mode="SIMULATED",
        parameters={"limit": 10, "format": "pdf"}  # Key order reversed, must sort identically
    )

    assert h1 == h2
    assert len(h1) == 64
    assert isinstance(h1, str)

def test_hash_to_bytes32_hex():
    sample_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    b32 = hash_to_bytes32_hex(sample_hash)
    assert b32 == f"0x{sample_hash}"
    assert len(b32) == 66

    # Test already prefixed
    assert hash_to_bytes32_hex(f"0x{sample_hash}") == f"0x{sample_hash}"

    # Test invalid length
    with pytest.raises(ValueError):
        hash_to_bytes32_hex("short_hash")

def test_timestamp_normalization():
    # ISO string with Z
    t1 = normalize_utc_timestamp("2026-10-27T10:30:00.000000Z")
    assert t1.endswith("Z")

    # Timezone offset +02:00 normalized to UTC
    t2 = normalize_utc_timestamp("2026-10-27T12:30:00.000000+02:00")
    assert t2 == "2026-10-27T10:30:00.000000Z"
    assert t1 == t2

    # Datetime object
    dt = datetime(2026, 10, 27, 10, 30, 0, tzinfo=timezone.utc)
    assert normalize_utc_timestamp(dt) == "2026-10-27T10:30:00.000000Z"

    # None timestamp must raise ValueError
    with pytest.raises(ValueError):
        normalize_utc_timestamp(None)

def test_unicode_and_special_characters():
    h = compute_canonical_event_hash(
        event_id="evt_unicode_01",
        timestamp="2026-10-27T12:00:00.000000Z",
        agent_id="agent-über-prüfer-🚀",
        action_type="UPDATE",
        resource="db://résumés/candidat_42",
        policy_decision="ALLOW",
        policy_id="POL-C",
        reason="Données chiffrées en UTF-8"
    )
    assert len(h) == 64

def test_hash_mismatch_on_tampering():
    ts = "2026-10-27T12:00:00.000000Z"
    original_hash = compute_canonical_event_hash(
        event_id="evt_tamper_test",
        timestamp=ts,
        agent_id="agent-1",
        action_type="DELETE",
        resource="db://orders/2026",
        policy_decision="REQUIRE_APPROVAL",
        policy_id="POL-D"
    )

    # Tampered resource
    tampered_resource_hash = compute_canonical_event_hash(
        event_id="evt_tamper_test",
        timestamp=ts,
        agent_id="agent-1",
        action_type="DELETE",
        resource="db://orders/2025",  # Altered!
        policy_decision="REQUIRE_APPROVAL",
        policy_id="POL-D"
    )
    assert original_hash != tampered_resource_hash

    # Tampered decision
    tampered_decision_hash = compute_canonical_event_hash(
        event_id="evt_tamper_test",
        timestamp=ts,
        agent_id="agent-1",
        action_type="DELETE",
        resource="db://orders/2026",
        policy_decision="ALLOW",  # Altered!
        policy_id="POL-D"
    )
    assert original_hash != tampered_decision_hash

def test_mandatory_fields_validation():
    with pytest.raises(ValueError, match="event_id"):
        CanonicalAuditEvent(
            event_id="",
            timestamp="2026-10-27T12:00:00Z",
            agent_id="agent-1",
            action_type="READ",
            resource="public/doc",
            policy_decision="ALLOW",
            policy_id="POL-A"
        )

    with pytest.raises(ValueError, match="resource"):
        CanonicalAuditEvent(
            event_id="evt_1",
            timestamp="2026-10-27T12:00:00Z",
            agent_id="agent-1",
            action_type="READ",
            resource="",
            policy_decision="ALLOW",
            policy_id="POL-A"
        )

def test_mutable_fields_are_excluded():
    # CanonicalAuditEvent only accepts immutable audit properties
    # Transaction hash or block numbers are not part of canonical input
    c = CanonicalAuditEvent(
        event_id="evt_test",
        timestamp="2026-10-27T12:00:00.000000Z",
        agent_id="agent",
        action_type="READ",
        resource="public/data",
        policy_decision="ALLOW",
        policy_id="POL-A"
    )
    d = c.to_canonical_dict()
    assert "transaction_hash" not in d
    assert "block_number" not in d
    assert "anchoring_status" not in d
    assert "verification_status" not in d
