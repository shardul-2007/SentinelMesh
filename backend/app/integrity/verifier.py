import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models import AuditEvent, IntegrityRecord
from app.integrity.canonical import (
    CanonicalAuditEvent,
    compute_canonical_event_hash,
    hash_to_bytes32_hex,
    CANONICAL_VERSION,
    HASH_ALGORITHM
)
from app.blockchain.service import get_blockchain_service

class IntegrityVerificationResult:
    def __init__(
        self,
        event_id: str,
        status: str,  # INTACT, TAMPERED, ANCHORED_AND_VERIFIED, NOT_ANCHORED, VERIFICATION_UNAVAILABLE
        local_matches: bool,
        onchain_matches: Optional[bool],
        onchain_exists: bool,
        calculated_hash: str,
        stored_hash: Optional[str],
        onchain_hash: Optional[str],
        blockchain_network: Optional[str],
        chain_id: Optional[int],
        contract_address: Optional[str],
        transaction_hash: Optional[str],
        block_number: Optional[int],
        last_verified_at: datetime,
        message: str
    ):
        self.event_id = event_id
        self.status = status
        self.local_matches = local_matches
        self.onchain_matches = onchain_matches
        self.onchain_exists = onchain_exists
        self.calculated_hash = calculated_hash
        self.stored_hash = stored_hash
        self.onchain_hash = onchain_hash
        self.blockchain_network = blockchain_network
        self.chain_id = chain_id
        self.contract_address = contract_address
        self.transaction_hash = transaction_hash
        self.block_number = block_number
        self.last_verified_at = last_verified_at
        self.message = message

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "status": self.status,
            "local_matches": self.local_matches,
            "onchain_matches": self.onchain_matches,
            "onchain_exists": self.onchain_exists,
            "calculated_hash": self.calculated_hash,
            "stored_hash": self.stored_hash,
            "onchain_hash": self.onchain_hash,
            "blockchain_network": self.blockchain_network,
            "chain_id": self.chain_id,
            "contract_address": self.contract_address,
            "transaction_hash": self.transaction_hash,
            "block_number": self.block_number,
            "last_verified_at": self.last_verified_at.isoformat() if self.last_verified_at else None,
            "message": self.message
        }


class IntegrityVerifier:
    """
    Independent audit verification service.
    Validates local audit records against stored integrity hashes and on-chain blockchain anchors.
    """

    @classmethod
    def verify_event(
        cls,
        event_id: str,
        db: Session,
        blockchain_service=None
    ) -> IntegrityVerificationResult:
        now_utc = datetime.now(timezone.utc)
        b_service = blockchain_service or get_blockchain_service()

        event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
        if not event:
            return IntegrityVerificationResult(
                event_id=event_id,
                status="VERIFICATION_UNAVAILABLE",
                local_matches=False,
                onchain_matches=None,
                onchain_exists=False,
                calculated_hash="",
                stored_hash=None,
                onchain_hash=None,
                blockchain_network=None,
                chain_id=None,
                contract_address=None,
                transaction_hash=None,
                block_number=None,
                last_verified_at=now_utc,
                message=f"Audit event '{event_id}' not found in database."
            )

        # 1. Retrieve or auto-create IntegrityRecord
        int_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == event_id).first()

        # Parse request parameters if available
        params = {}
        if event.request and event.request.parameters:
            try:
                params = json.loads(event.request.parameters)
            except Exception:
                params = {}

        # 2. Recalculate canonical hash from current database state
        calculated_raw_hash = compute_canonical_event_hash(
            event_id=event.id,
            timestamp=event.timestamp,
            agent_id=event.agent_id,
            action_type=event.action_type,
            resource=event.resource,
            policy_decision=event.policy_decision,
            policy_id=event.policy_id,
            policy_version=event.policy_version,
            reason=event.reason,
            execution_mode=event.execution_mode,
            parameters=params,
            canonical_version=int_rec.canonical_version if int_rec else CANONICAL_VERSION
        )
        calculated_hash = hash_to_bytes32_hex(calculated_raw_hash)

        # If no integrity record exists yet (e.g. initial migration), create it
        if not int_rec:
            int_rec = IntegrityRecord(
                id=f"int_{event.id}",
                event_id=event.id,
                hash_algorithm=HASH_ALGORITHM,
                canonical_version=CANONICAL_VERSION,
                event_hash=calculated_hash,
                anchoring_status="NOT_ANCHORED",
                verification_status="INTACT",
                last_verified_at=now_utc
            )
            db.add(int_rec)
            db.commit()
            db.refresh(int_rec)

        stored_hash = int_rec.event_hash
        local_matches = (calculated_hash.lower() == stored_hash.lower())

        # 3. Query on-chain anchor if configured
        onchain_res = b_service.verify_onchain(event.id, stored_hash)
        
        onchain_available = onchain_res.get("available", False)
        onchain_exists = onchain_res.get("exists", False)
        onchain_matches = onchain_res.get("matches", None)
        onchain_details = onchain_res.get("anchor_details")
        onchain_hash = onchain_details.get("onchain_hash") if onchain_details else None

        # 4. Strict Precedence Evaluation
        # If on-chain anchor exists:
        if onchain_exists:
            # Does the current record match the immutable on-chain anchor?
            matches_onchain = (onchain_hash is not None and calculated_hash.lower() == onchain_hash.lower())
            
            if not matches_onchain:
                # Critical security rule: A record that differs from the on-chain anchor is TAMPERED,
                # even if local database metadata matches itself!
                status = "TAMPERED"
                msg = f"TAMPER DETECTED! Current record hash ({calculated_hash}) differs from immutable on-chain blockchain anchor ({onchain_hash})."
            else:
                status = "ANCHORED_AND_VERIFIED"
                msg = f"VERIFIED: Event hash independently confirmed against smart contract anchor on {b_service.network_name} (Block #{onchain_details.get('block_number')})."
        elif not local_matches:
            status = "TAMPERED"
            msg = f"TAMPER DETECTED: Current record hash ({calculated_hash}) does not match stored integrity hash ({stored_hash})."
        elif int_rec.anchoring_status == "ANCHORED" and not onchain_available:
            # Event was previously anchored, but blockchain RPC is currently unreachable
            status = "VERIFICATION_UNAVAILABLE"
            msg = f"Blockchain evidence temporarily unavailable: {onchain_res.get('error', 'RPC connection error')}."
        else:
            status = "INTACT"
            msg = f"Record integrity intact against local SHA-256 hash. Event is not yet anchored on-chain."

        # 5. Persist verification outcome
        int_rec.verification_status = status
        int_rec.last_verified_at = now_utc
        int_rec.verification_details = json.dumps({
            "local_matches": local_matches,
            "onchain_matches": onchain_matches,
            "onchain_exists": onchain_exists,
            "calculated_hash": calculated_hash,
            "stored_hash": stored_hash,
            "onchain_hash": onchain_hash,
            "verified_at": now_utc.isoformat()
        })
        db.commit()

        # 6. Create TamperAlert if tampering detected
        if status == "TAMPERED":
            import uuid
            from app.models import TamperAlert
            existing_alert = db.query(TamperAlert).filter(
                TamperAlert.event_id == event.id,
                TamperAlert.status.in_(["OPEN", "INVESTIGATING"])
            ).first()
            if not existing_alert:
                trusted_src = "BLOCKCHAIN_CONTRACT" if onchain_exists else "LOCAL_RECORD"
                expected_h = onchain_hash if onchain_exists else stored_hash
                alert_id = f"alt_{uuid.uuid4().hex[:12]}"
                new_alert = TamperAlert(
                    id=alert_id,
                    event_id=event.id,
                    detection_timestamp=now_utc,
                    severity="CRITICAL",
                    status="OPEN",
                    trusted_source=trusted_src,
                    expected_hash=expected_h or "UNKNOWN",
                    calculated_hash=calculated_hash,
                    details=json.dumps({
                        "message": msg,
                        "local_stored_hash": stored_hash,
                        "onchain_hash": onchain_hash,
                        "calculated_hash": calculated_hash,
                        "event_resource": event.resource,
                        "event_action": event.action_type
                    })
                )
                db.add(new_alert)
                db.commit()

        return IntegrityVerificationResult(
            event_id=event.id,
            status=status,
            local_matches=local_matches,
            onchain_matches=onchain_matches,
            onchain_exists=onchain_exists,
            calculated_hash=calculated_hash,
            stored_hash=stored_hash,
            onchain_hash=onchain_hash,
            blockchain_network=int_rec.blockchain_network or b_service.network_name,
            chain_id=int_rec.chain_id or b_service.chain_id,
            contract_address=int_rec.contract_address or b_service.contract_address,
            transaction_hash=int_rec.transaction_hash,
            block_number=int_rec.block_number or (onchain_details.get("block_number") if onchain_details else None),
            last_verified_at=now_utc,
            message=msg
        )
