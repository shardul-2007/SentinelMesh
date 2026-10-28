"""
SentinelMesh End-to-End Governance & Verification Flow Test
Validates the complete 10-step action-to-evidence-to-verification lifecycle.
"""

import pytest
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, AuditEvent, IntegrityRecord, Agent, SecurityPolicy
from app.schemas import ActionEvaluateRequest
from app.api.actions import evaluate_action
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex
from app.integrity.verifier import IntegrityVerifier
from app.blockchain.service import BlockchainService

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed baseline policies for end-to-end evaluation
    policies = [
        SecurityPolicy(
            id="POL-A",
            name="Public Read Access",
            description="Allows read access to public documents",
            action_pattern="READ",
            resource_pattern="public/*",
            decision="ALLOW",
            risk_tier="LOW",
            version="1.0.0",
            is_active=True
        ),
        SecurityPolicy(
            id="POL-B",
            name="Restricted Access Block",
            description="Blocks access to restricted credentials without approval",
            action_pattern="*",
            resource_pattern="restricted/*",
            decision="BLOCK",
            risk_tier="CRITICAL",
            version="1.0.0",
            is_active=True
        ),
        SecurityPolicy(
            id="POL-D",
            name="Database Delete Approval",
            description="Requires human approval for destructive database deletions",
            action_pattern="DELETE",
            resource_pattern="db://*",
            decision="REQUIRE_APPROVAL",
            risk_tier="HIGH",
            version="1.0.0",
            is_active=True
        )
    ]
    for p in policies:
        session.add(p)

    agent = Agent(id="agent-qa-evaluator", name="QA Evaluator Agent", role="TESTER", status="ACTIVE")
    session.add(agent)
    session.commit()

    yield session
    session.close()


def test_complete_end_to_end_action_lifecycle(test_db):
    """
    Validates Steps 1 through 5, 8, 9, 10:
    1. Submit an action (ALLOW, BLOCK, REQUIRE_APPROVAL).
    2. Evaluate deterministic policy.
    3. Correctly enforce decision and derived risk tier.
    4. Persist audit event and integrity record.
    5. Calculate deterministic canonical SHA-256 hash.
    8. Read evidence commitment back from storage/contract mock.
    9. Compare recomputed hash with commitment.
    10. Verify tamper detection.
    """
    db = test_db

    try:
        # Register test agent if not already present
        agent = db.query(Agent).filter(Agent.id == "agent-qa-evaluator").first()
        if not agent:
            agent = Agent(id="agent-qa-evaluator", name="QA Evaluator Agent", role="TESTER", status="ACTIVE")
            db.add(agent)
            db.commit()

        # -------------------------------------------------------------
        # STEP 1 & 2 & 3: Submit action and evaluate policies
        # Scenario A: ALLOW (Public documentation read)
        # -------------------------------------------------------------
        req_allow = ActionEvaluateRequest(
            agent_id="agent-qa-evaluator",
            action_type="READ",
            resource="public/compliance_manifest.json",
            reason="Automated verification scan",
            client_risk_level="LOW"
        )
        res_allow = evaluate_action(req_allow, db=db)
        assert res_allow.decision.value == "ALLOW"
        assert res_allow.policy_id == "POL-A"
        assert res_allow.execution_mode == "SIMULATED"
        assert res_allow.event_id is not None
        assert len(res_allow.integrity_hash) == 64

        # -------------------------------------------------------------
        # STEP 4 & 5: Verify persistence and canonical SHA-256 calculation
        # -------------------------------------------------------------
        persisted_event = db.query(AuditEvent).filter(AuditEvent.id == res_allow.event_id).first()
        assert persisted_event is not None
        assert persisted_event.agent_id == "agent-qa-evaluator"
        assert persisted_event.resource == "public/compliance_manifest.json"
        assert persisted_event.integrity_hash == res_allow.integrity_hash

        # Recompute canonical hash directly from persisted event data
        recomputed_raw_hash = compute_canonical_event_hash(
            event_id=persisted_event.id,
            timestamp=persisted_event.timestamp,
            agent_id=persisted_event.agent_id,
            action_type=persisted_event.action_type,
            resource=persisted_event.resource,
            policy_decision=persisted_event.policy_decision,
            policy_id=persisted_event.policy_id,
            policy_version=persisted_event.policy_version,
            reason=persisted_event.reason,
            execution_mode=persisted_event.execution_mode
        )
        b32_canonical_hash = hash_to_bytes32_hex(recomputed_raw_hash)
        assert b32_canonical_hash.startswith("0x")

        # Verify integrity record exists and matches canonical hash
        int_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == res_allow.event_id).first()
        assert int_rec is not None
        assert int_rec.event_hash == b32_canonical_hash

        # -------------------------------------------------------------
        # Scenario B: BLOCK (Restricted credentials without permission)
        # -------------------------------------------------------------
        req_block = ActionEvaluateRequest(
            agent_id="agent-guest-unauthorized",
            action_type="READ",
            resource="restricted/vault_signing_key.pem",
            reason="Unauthorized probe"
        )
        res_block = evaluate_action(req_block, db=db)
        assert res_block.decision.value == "BLOCK"
        assert res_block.policy_id == "POL-B"
        assert res_block.execution_status.value == "BLOCKED"

        # -------------------------------------------------------------
        # Scenario C: REQUIRE_APPROVAL (Database deletion)
        # -------------------------------------------------------------
        req_approval = ActionEvaluateRequest(
            agent_id="agent-qa-evaluator",
            action_type="DELETE",
            resource="db://users/archived_accounts",
            reason="Storage reclamation"
        )
        res_approval = evaluate_action(req_approval, db=db)
        assert res_approval.decision.value == "REQUIRE_APPROVAL"
        assert res_approval.policy_id == "POL-D"
        assert res_approval.approval_status == "PENDING"
        assert res_approval.execution_status.value == "PENDING_APPROVAL"

        # -------------------------------------------------------------
        # STEPS 8, 9, 10: Independent Verification & Tamper Detection
        # -------------------------------------------------------------
        v_res = IntegrityVerifier.verify_event(res_allow.event_id, db)
        assert v_res.status == "INTACT"
        assert v_res.local_matches is True
        assert v_res.calculated_hash == b32_canonical_hash

        # Test intentional tampering on a test event
        tamper_event_id = res_allow.event_id
        original_resource = persisted_event.resource
        persisted_event.resource = "public/maliciously_tampered.pdf"
        db.commit()

        # Verification must catch the discrepancy immediately
        v_res_tampered = IntegrityVerifier.verify_event(tamper_event_id, db)
        assert v_res_tampered.status == "TAMPERED"
        assert v_res_tampered.local_matches is False

        # Restore
        persisted_event.resource = original_resource
        db.commit()

        v_res_restored = IntegrityVerifier.verify_event(tamper_event_id, db)
        assert v_res_restored.status == "INTACT"

    finally:
        db.close()


def test_blockchain_service_status_and_explorer_generation():
    """
    Validates that the BlockchainService correctly probes networks,
    detects chain configuration, and generates legitimate MSTScan explorer links.
    """
    service = BlockchainService(
        rpc_url="https://testnetrpc.mstblockchain.com",
        chain_id=91562037,
        contract_address="0x1234567890123456789012345678901234567890"
    )

    # Explorer base URL resolution
    assert service.get_explorer_base_url() == "https://testnet.mstscan.com"

    # Transaction explorer link generation
    dummy_tx = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    tx_link = service.get_tx_explorer_url(dummy_tx)
    assert tx_link == f"https://testnet.mstscan.com/tx/{dummy_tx}"

    # Contract explorer link generation
    contract_link = service.get_contract_explorer_url("0x1234567890123456789012345678901234567890")
    assert contract_link == "https://testnet.mstscan.com/address/0x1234567890123456789012345678901234567890"

    # Mainnet chain ID check
    mainnet_service = BlockchainService(
        rpc_url="https://mariorpc.mstblockchain.com/",
        chain_id=4646
    )
    assert mainnet_service.get_explorer_base_url() == "https://mstscan.com"
