import pytest
from datetime import datetime, timezone
from app.models import AuditEvent, IntegrityRecord
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex
from app.integrity.verifier import IntegrityVerifier

class MockBlockchainService:
    """Mock for testing blockchain anchoring and tamper detection without requiring a live node."""
    def __init__(self, anchored_events=None, is_online=True):
        self.anchored_events = anchored_events or {}
        self.is_online = is_online
        self.network_name = "Mock EVM Local"
        self.chain_id = 31337
        self.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    def verify_onchain(self, event_id: str, expected_hash_hex: str):
        if not self.is_online:
            return {"available": False, "error": "RPC connection failed"}

        if event_id not in self.anchored_events:
            return {"available": True, "exists": False, "matches": False}

        onchain_hash = self.anchored_events[event_id]
        matches = (onchain_hash.lower() == expected_hash_hex.lower())
        return {
            "available": True,
            "exists": True,
            "matches": matches,
            "anchor_details": {
                "onchain_hash": onchain_hash,
                "timestamp": 1729000000,
                "block_number": 1042,
                "submitter": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            }
        }

def test_verify_intact_local_record():
    from app.database import SessionLocal
    db = SessionLocal()
    evt_id = f"evt_verify_intact_{datetime.now(timezone.utc).timestamp()}"
    now_utc = datetime.now(timezone.utc)
    test_reason = "Integrity verification test"
    raw_hash = compute_canonical_event_hash(
        event_id=evt_id,
        timestamp=now_utc,
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/annual_metrics.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED"
    )
    b32_hash = hash_to_bytes32_hex(raw_hash)
    evt = AuditEvent(
        id=evt_id,
        timestamp=now_utc,
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/annual_metrics.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED",
        execution_status="EXECUTED_SIMULATED",
        integrity_hash=b32_hash
    )
    int_rec = IntegrityRecord(
        id=f"int_{evt_id}",
        event_id=evt_id,
        event_hash=b32_hash,
        anchoring_status="NOT_ANCHORED",
        verification_status="UNVERIFIED"
    )
    db.add(evt)
    db.add(int_rec)
    db.commit()

    # Verify event integrity using IntegrityVerifier
    result = IntegrityVerifier.verify_event(evt_id, db)
    assert result.status == "INTACT"
    assert result.local_matches is True
    assert result.onchain_exists is False
    assert "intact against local SHA-256" in result.message
    db.close()

def test_tamper_detection_on_mutated_database_record():
    from app.database import SessionLocal
    db = SessionLocal()

    # 1. Create a legitimate event
    evt_id = f"evt_tamper_detect_{datetime.now(timezone.utc).timestamp()}"
    now_utc = datetime.now(timezone.utc)
    test_reason = "Pre-tamper test record"
    raw_hash = compute_canonical_event_hash(
        event_id=evt_id,
        timestamp=now_utc,
        agent_id="agent-financial-bot",
        action_type="READ",
        resource="public/budget_2026.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED"
    )
    b32_hash = hash_to_bytes32_hex(raw_hash)
    evt = AuditEvent(
        id=evt_id,
        timestamp=now_utc,
        agent_id="agent-financial-bot",
        action_type="READ",
        resource="public/budget_2026.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED",
        execution_status="EXECUTED_SIMULATED",
        integrity_hash=b32_hash
    )
    int_rec = IntegrityRecord(
        id=f"int_{evt_id}",
        event_id=evt_id,
        event_hash=b32_hash,
        anchoring_status="NOT_ANCHORED",
        verification_status="UNVERIFIED"
    )
    db.add(evt)
    db.add(int_rec)
    db.commit()

    # 2. Tamper with the database row directly
    evt.resource = "restricted/tampered_secrets.env"  # Controlled malicious modification!
    db.commit()

    # 3. Independent verification must report TAMPERED!
    result = IntegrityVerifier.verify_event(evt_id, db)
    assert result.status == "TAMPERED"
    assert result.local_matches is False
    assert "TAMPER DETECTED" in result.message
    db.close()

def test_blockchain_anchored_and_verified_scenario():
    from app.database import SessionLocal

    db = SessionLocal()
    # Create a test audit event
    evt_id = f"evt_blockchain_anchor_test_{datetime.now(timezone.utc).timestamp()}"
    now_utc = datetime.now(timezone.utc)
    test_reason = "Blockchain anchoring test"
    raw_hash = compute_canonical_event_hash(
        event_id=evt_id,
        timestamp=now_utc,
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/whitepaper.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED"
    )
    b32_hash = hash_to_bytes32_hex(raw_hash)

    evt = AuditEvent(
        id=evt_id,
        timestamp=now_utc,
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/whitepaper.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED",
        execution_status="EXECUTED_SIMULATED",
        approval_status="NONE",
        integrity_hash=raw_hash
    )
    db.add(evt)

    int_rec = IntegrityRecord(
        id=f"int_{evt_id}",
        event_id=evt_id,
        hash_algorithm="SHA-256",
        canonical_version="1.0.0",
        event_hash=b32_hash,
        blockchain_network="Mock EVM Local",
        contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        transaction_hash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        block_number=1042,
        anchoring_status="ANCHORED",
        anchored_at=now_utc
    )
    db.add(int_rec)
    db.commit()

    # 1. When on-chain hash matches expected hash -> ANCHORED_AND_VERIFIED
    mock_b = MockBlockchainService(anchored_events={evt_id: b32_hash})
    res_verified = IntegrityVerifier.verify_event(evt_id, db, blockchain_service=mock_b)
    assert res_verified.status == "ANCHORED_AND_VERIFIED"
    assert res_verified.onchain_matches is True
    assert res_verified.onchain_exists is True

    # 2. Controlled tampering test: Attacker alters local DB record AND stored hash
    # Even if stored_hash matches recalculated hash, comparison against ON-CHAIN hash proves TAMPERED!
    evt.resource = "public/malicious_altered_document.pdf"
    new_tampered_hash = hash_to_bytes32_hex(compute_canonical_event_hash(
        event_id=evt_id,
        timestamp=now_utc,
        agent_id="agent-data-analyzer",
        action_type="READ",
        resource="public/malicious_altered_document.pdf",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED"
    ))
    int_rec.event_hash = new_tampered_hash
    db.commit()

    res_tampered = IntegrityVerifier.verify_event(evt_id, db, blockchain_service=mock_b)
    assert res_tampered.status == "TAMPERED"
    assert "differs from immutable on-chain blockchain anchor" in res_tampered.message

    db.close()

def test_blockchain_rpc_outage_reported_as_unavailable():
    from app.database import SessionLocal

    db = SessionLocal()
    evt_id = f"evt_outage_test_{datetime.now(timezone.utc).timestamp()}"
    now_utc = datetime.now(timezone.utc)
    test_reason = "Testing outage"
    raw_hash = compute_canonical_event_hash(
        event_id=evt_id,
        timestamp=now_utc,
        agent_id="agent-1",
        action_type="READ",
        resource="public/doc",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED"
    )
    b32_hash = hash_to_bytes32_hex(raw_hash)

    evt = AuditEvent(
        id=evt_id,
        timestamp=now_utc,
        agent_id="agent-1",
        action_type="READ",
        resource="public/doc",
        policy_decision="ALLOW",
        policy_id="POL-A",
        policy_version="1.0.0",
        reason=test_reason,
        execution_mode="SIMULATED",
        execution_status="EXECUTED_SIMULATED",
        approval_status="NONE",
        integrity_hash=raw_hash
    )
    db.add(evt)

    int_rec = IntegrityRecord(
        id=f"int_{evt_id}",
        event_id=evt_id,
        event_hash=b32_hash,
        anchoring_status="ANCHORED",
        anchored_at=now_utc
    )
    db.add(int_rec)
    db.commit()

    # Blockchain service is offline
    offline_b = MockBlockchainService(is_online=False)
    res = IntegrityVerifier.verify_event(evt_id, db, blockchain_service=offline_b)
    assert res.status == "VERIFICATION_UNAVAILABLE"
    assert "temporarily unavailable" in res.message

    db.close()
