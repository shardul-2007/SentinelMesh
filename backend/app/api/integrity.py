import json
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.config import settings
from app.models import AuditEvent, IntegrityRecord, TamperAlert, User
from app.auth import get_current_user, require_roles
from app.schemas import (
    IntegrityRecordResponse,
    IntegrityVerificationResponse,
    IntegrityAnchorResponse,
    BlockchainStatusResponse,
    BlockchainTransactionResponse,
    EvidenceInspectorResponse
)
from app.integrity.canonical import (
    compute_canonical_event_hash,
    hash_to_bytes32_hex,
    CANONICAL_VERSION,
    HASH_ALGORITHM
)
from app.integrity.verifier import IntegrityVerifier
from app.blockchain.service import get_blockchain_service

router = APIRouter(prefix="/api/integrity", tags=["Integrity & Blockchain"])

def verify_admin_auth(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    """
    Restrict blockchain transaction initiation to authorized callers.
    Prevents unauthorized clients from submitting transactions or gas-costly ops.
    """
    if not x_admin_key or x_admin_key.strip() != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid 'X-Admin-Key' header required for blockchain anchoring operations."
        )
    return x_admin_key

@router.get("/status", response_model=BlockchainStatusResponse)
def get_blockchain_status(db: Session = Depends(get_db)):
    """
    Returns live blockchain node connectivity, contract address, network info,
    and aggregate anchoring/tamper statistics.
    """
    b_service = get_blockchain_service()
    status_dict = b_service.get_status()

    total_anchors = db.query(IntegrityRecord).filter(IntegrityRecord.anchoring_status == "ANCHORED").count()
    total_verified = db.query(IntegrityRecord).filter(IntegrityRecord.verification_status == "ANCHORED_AND_VERIFIED").count()
    total_tampered = db.query(IntegrityRecord).filter(IntegrityRecord.verification_status == "TAMPERED").count()

    return BlockchainStatusResponse(
        mode=status_dict["mode"],
        connected=status_dict["connected"],
        rpc_url=status_dict["rpc_url"],
        configured_chain_id=status_dict["configured_chain_id"],
        detected_chain_id=status_dict["detected_chain_id"],
        latest_block=status_dict["latest_block"],
        contract_address=status_dict["contract_address"],
        has_contract=status_dict["has_contract"],
        signer_address=status_dict["signer_address"],
        network_name=status_dict["network_name"],
        description=status_dict["description"],
        total_anchors=total_anchors,
        total_verified=total_verified,
        total_tampered=total_tampered,
        explorer_base_url=status_dict.get("explorer_base_url"),
        contract_explorer_url=status_dict.get("contract_explorer_url"),
        native_token=status_dict.get("native_token"),
        faucet_url=status_dict.get("faucet_url")
    )


@router.get("/transactions", response_model=List[BlockchainTransactionResponse])
def list_blockchain_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve real blockchain transactions anchored by SentinelMesh on MST Blockchain.
    """
    b_service = get_blockchain_service()
    records = (
        db.query(IntegrityRecord)
        .filter(IntegrityRecord.transaction_hash.isnot(None))
        .order_by(IntegrityRecord.anchored_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    transactions = []
    for r in records:
        tx_url = b_service.get_tx_explorer_url(r.transaction_hash) if r.transaction_hash else None
        transactions.append(
            BlockchainTransactionResponse(
                transaction_hash=r.transaction_hash,
                event_id=r.event_id,
                contract_address=r.contract_address or b_service.contract_address or "",
                chain_id=r.chain_id or b_service.chain_id,
                network_name=r.blockchain_network or b_service.network_name,
                block_number=r.block_number,
                status="CONFIRMED" if r.anchoring_status == "ANCHORED" else r.anchoring_status,
                timestamp=r.anchored_at,
                explorer_url=tx_url,
                canonical_hash=r.event_hash
            )
        )
    return transactions


@router.get("/evidence/{event_id}", response_model=EvidenceInspectorResponse)
def get_evidence_inspector(event_id: str, db: Session = Depends(get_db)):
    """
    Detailed Evidence Inspector for a single evidence record.
    Provides canonical payload, recomputed SHA-256 hash, stored commitment,
    MST contract details, and real-time independent verification.
    """
    event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Audit event '{event_id}' not found.")

    from app.integrity.canonical import build_canonical_document, compute_canonical_event_hash
    canonical_doc = build_canonical_document(
        event_id=event.id,
        timestamp=event.timestamp,
        agent_id=event.agent_id,
        action_type=event.action_type,
        resource=event.resource,
        policy_decision=event.policy_decision,
        policy_id=event.policy_id,
        policy_version=event.policy_version,
        reason=event.reason,
        execution_mode=event.execution_mode
    )
    recomputed_hash = hash_to_bytes32_hex(compute_canonical_event_hash(
        event_id=event.id,
        timestamp=event.timestamp,
        agent_id=event.agent_id,
        action_type=event.action_type,
        resource=event.resource,
        policy_decision=event.policy_decision,
        policy_id=event.policy_id,
        policy_version=event.policy_version,
        reason=event.reason,
        execution_mode=event.execution_mode
    ))

    verifier = IntegrityVerifier(db)
    v_res = verifier.verify_event(event_id)

    int_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == event_id).first()
    b_service = get_blockchain_service()

    tx_hash = int_rec.transaction_hash if int_rec else None
    tx_url = b_service.get_tx_explorer_url(tx_hash) if tx_hash else None
    contract_addr = int_rec.contract_address if int_rec and int_rec.contract_address else b_service.contract_address
    contract_url = b_service.get_contract_explorer_url(contract_addr) if contract_addr else None

    # Load approval history if exists
    approval_history = None
    if event.approval_decision:
        try:
            approval_history = json.loads(event.approval_decision) if isinstance(event.approval_decision, str) else event.approval_decision
        except Exception:
            pass

    return EvidenceInspectorResponse(
        evidence_id=f"evi_{event.id[4:]}" if event.id.startswith("evt_") else f"evi_{event.id}",
        event_id=event.id,
        agent_id=event.agent_id,
        action_type=event.action_type,
        resource=event.resource,
        action_summary=f"{event.agent_id} requested {event.action_type} on {event.resource} ({event.policy_decision})",
        policy_decision=event.policy_decision,
        policy_id=event.policy_id,
        policy_version=event.policy_version or "1.0.0",
        canonical_version=CANONICAL_VERSION,
        canonical_payload=canonical_doc,
        recomputed_hash=recomputed_hash,
        stored_commitment=int_rec.event_hash if int_rec else None,
        contract_address=contract_addr,
        transaction_hash=tx_hash,
        block_number=int_rec.block_number if int_rec else None,
        anchoring_status=int_rec.anchoring_status if int_rec else "NOT_ANCHORED",
        anchored_at=int_rec.anchored_at if int_rec else None,
        network_name=int_rec.blockchain_network if int_rec and int_rec.blockchain_network else b_service.network_name,
        chain_id=int_rec.chain_id if int_rec and int_rec.chain_id else b_service.chain_id,
        explorer_url=tx_url,
        contract_explorer_url=contract_url,
        verification_status=v_res.status,
        independent_verification={
            "local_matches": v_res.local_matches,
            "onchain_matches": v_res.onchain_matches,
            "onchain_exists": v_res.onchain_exists,
            "status": v_res.status,
            "message": v_res.message,
            "verified_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        approval_history=approval_history
    )

@router.get("/events", response_model=List[IntegrityRecordResponse])
def list_integrity_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """
    List integrity records with optional status filter (e.g. ANCHORED, TAMPERED, INTACT).
    """
    query = db.query(IntegrityRecord)
    if isinstance(status_filter, str) and status_filter.upper() != "ALL":
        query = query.filter(
            (IntegrityRecord.anchoring_status == status_filter.upper()) |
            (IntegrityRecord.verification_status == status_filter.upper())
        )

    records = (
        query.order_by(IntegrityRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [IntegrityRecordResponse.model_validate(r) for r in records]

@router.get("/events/{event_id}", response_model=IntegrityRecordResponse)
def get_integrity_record(event_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the integrity record for an audit event.
    """
    int_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == event_id).first()
    if not int_rec:
        # Check if audit event exists; if so, create baseline integrity record
        event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail=f"Audit event '{event_id}' not found.")
        
        # Auto-initialize integrity record
        calc_hash = hash_to_bytes32_hex(compute_canonical_event_hash(
            event_id=event.id,
            timestamp=event.timestamp,
            agent_id=event.agent_id,
            action_type=event.action_type,
            resource=event.resource,
            policy_decision=event.policy_decision,
            policy_id=event.policy_id,
            policy_version=event.policy_version,
            reason=event.reason,
            execution_mode=event.execution_mode
        ))
        int_rec = IntegrityRecord(
            id=f"int_{event.id}",
            event_id=event.id,
            hash_algorithm=HASH_ALGORITHM,
            canonical_version=CANONICAL_VERSION,
            event_hash=calc_hash,
            anchoring_status="NOT_ANCHORED",
            verification_status="INTACT",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(int_rec)
        db.commit()
        db.refresh(int_rec)

    return IntegrityRecordResponse.model_validate(int_rec)

@router.post("/events/{event_id}/hash")
def generate_or_recompute_hash(event_id: str, db: Session = Depends(get_db)):
    """
    Compute deterministic canonical hash for an audit event and sync it to the integrity record.
    """
    event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Audit event '{event_id}' not found.")

    raw_hash = compute_canonical_event_hash(
        event_id=event.id,
        timestamp=event.timestamp,
        agent_id=event.agent_id,
        action_type=event.action_type,
        resource=event.resource,
        policy_decision=event.policy_decision,
        policy_id=event.policy_id,
        policy_version=event.policy_version,
        reason=event.reason,
        execution_mode=event.execution_mode
    )
    bytes32_hash = hash_to_bytes32_hex(raw_hash)

    int_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == event_id).first()
    if not int_rec:
        int_rec = IntegrityRecord(
            id=f"int_{event.id}",
            event_id=event.id,
            hash_algorithm=HASH_ALGORITHM,
            canonical_version=CANONICAL_VERSION,
            event_hash=bytes32_hash,
            anchoring_status="NOT_ANCHORED",
            verification_status="INTACT",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(int_rec)
    else:
        int_rec.event_hash = bytes32_hash

    db.commit()
    db.refresh(int_rec)

    return {
        "event_id": event.id,
        "hash_algorithm": HASH_ALGORITHM,
        "canonical_version": CANONICAL_VERSION,
        "event_hash": bytes32_hash,
        "anchoring_status": int_rec.anchoring_status
    }

@router.post("/events/{event_id}/anchor", response_model=IntegrityAnchorResponse)
def anchor_event_to_blockchain(
    event_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Authorized endpoint to anchor an audit event's hash to the EVM smart contract.
    Submits transaction, waits for on-chain receipt, and records block evidence.
    """
    event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Audit event '{event_id}' not found.")

    int_rec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == event_id).first()
    if not int_rec:
        raw_hash = compute_canonical_event_hash(
            event_id=event.id,
            timestamp=event.timestamp,
            agent_id=event.agent_id,
            action_type=event.action_type,
            resource=event.resource,
            policy_decision=event.policy_decision,
            policy_id=event.policy_id,
            policy_version=event.policy_version,
            reason=event.reason,
            execution_mode=event.execution_mode
        )
        int_rec = IntegrityRecord(
            id=f"int_{event.id}",
            event_id=event.id,
            hash_algorithm=HASH_ALGORITHM,
            canonical_version=CANONICAL_VERSION,
            event_hash=hash_to_bytes32_hex(raw_hash),
            anchoring_status="NOT_ANCHORED",
            verification_status="INTACT"
        )
        db.add(int_rec)
        db.commit()
        db.refresh(int_rec)

    # Idempotency check: if already confirmed anchored, do not duplicate
    if int_rec.anchoring_status == "ANCHORED" and int_rec.transaction_hash:
        return IntegrityAnchorResponse(
            event_id=event.id,
            status="ALREADY_ANCHORED",
            transaction_hash=int_rec.transaction_hash,
            block_number=int_rec.block_number or 0,
            contract_address=int_rec.contract_address or "",
            chain_id=int_rec.chain_id or 31337,
            network_name=int_rec.blockchain_network or "EVM",
            anchored_at=int_rec.anchored_at or datetime.datetime.now(datetime.timezone.utc),
            message=f"Event '{event_id}' was previously anchored in block #{int_rec.block_number}."
        )

    b_service = get_blockchain_service()
    try:
        receipt_data = b_service.anchor_event_hash(event_id, int_rec.event_hash)
    except ConnectionError as ce:
        raise HTTPException(status_code=503, detail=str(ce))
    except (ValueError, PermissionError) as pe:
        raise HTTPException(status_code=400, detail=str(pe))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    int_rec.blockchain_network = receipt_data["network_name"]
    int_rec.chain_id = receipt_data["chain_id"]
    int_rec.contract_address = receipt_data["contract_address"]
    int_rec.transaction_hash = receipt_data["transaction_hash"]
    int_rec.block_number = receipt_data["block_number"]
    int_rec.anchoring_status = "ANCHORED"
    int_rec.anchored_at = now_utc
    int_rec.verification_status = "ANCHORED_AND_VERIFIED"
    int_rec.last_verified_at = now_utc
    db.commit()
    db.refresh(int_rec)

    return IntegrityAnchorResponse(
        event_id=event.id,
        status="CONFIRMED",
        transaction_hash=receipt_data["transaction_hash"],
        block_number=receipt_data["block_number"],
        contract_address=receipt_data["contract_address"],
        chain_id=receipt_data["chain_id"],
        network_name=receipt_data["network_name"],
        anchored_at=now_utc,
        message=f"Audit hash successfully anchored on-chain in transaction {receipt_data['transaction_hash']} (Block #{receipt_data['block_number']})."
    )

@router.post("/events/{event_id}/verify", response_model=IntegrityVerificationResponse)
def verify_event_integrity(event_id: str, db: Session = Depends(get_db)):
    """
    Independent verification of an audit event:
    1. Recalculates canonical event hash from database.
    2. Compares against stored integrity hash.
    3. If anchored, retrieves hash from the smart contract on-chain.
    4. Evaluates tamper evidence and returns structured diagnostic report.
    """
    result = IntegrityVerifier.verify_event(event_id, db)
    return IntegrityVerificationResponse(
        event_id=result.event_id,
        status=result.status,
        local_matches=result.local_matches,
        onchain_matches=result.onchain_matches,
        onchain_exists=result.onchain_exists,
        calculated_hash=result.calculated_hash,
        stored_hash=result.stored_hash,
        onchain_hash=result.onchain_hash,
        blockchain_network=result.blockchain_network,
        chain_id=result.chain_id,
        contract_address=result.contract_address,
        transaction_hash=result.transaction_hash,
        block_number=result.block_number,
        last_verified_at=result.last_verified_at,
        message=result.message
    )


class TamperAlertResponse(BaseModel):
    id: str
    event_id: str
    detection_timestamp: datetime.datetime
    severity: str
    status: str
    trusted_source: str
    expected_hash: str
    calculated_hash: str
    details: str
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ResolveAlertRequest(BaseModel):
    resolution_note: str

class SimulateTamperRequest(BaseModel):
    event_id: Optional[str] = None
    tampered_resource: Optional[str] = None

@router.get("/alerts", response_model=List[TamperAlertResponse])
def list_tamper_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """
    Retrieve audit integrity alerts triggered by hash mismatches against
    local integrity records or blockchain contracts.
    """
    query = db.query(TamperAlert)
    if isinstance(status_filter, str):
        query = query.filter(TamperAlert.status == status_filter.upper())
    alerts = query.order_by(TamperAlert.detection_timestamp.desc()).all()
    return [TamperAlertResponse.model_validate(a) for a in alerts]

@router.post("/alerts/{alert_id}/resolve", response_model=TamperAlertResponse)
def resolve_tamper_alert(
    alert_id: str,
    payload: ResolveAlertRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Authorized endpoint (ADMIN) to investigate and resolve a tamper alert.
    Generates an immutable audit record for the administrative resolution action.
    """
    alert = db.query(TamperAlert).filter(TamperAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Tamper alert '{alert_id}' not found.")

    if alert.status == "RESOLVED":
        raise HTTPException(status_code=400, detail="Alert has already been resolved.")

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    alert.status = "RESOLVED"
    alert.resolved_by = admin_user.username
    alert.resolution_note = payload.resolution_note.strip()
    alert.resolved_at = now_utc

    # Record administrative action in immutable audit trail
    admin_evt_id = f"evt_res_{uuid.uuid4().hex[:10]}"
    res_evt = AuditEvent(
        id=admin_evt_id,
        timestamp=now_utc,
        agent_id="admin-security-operations",
        action_type="ADMIN_SECURITY_ALERT_RESOLVE",
        resource=f"alerts/{alert_id}",
        policy_decision="ALLOW",
        policy_id="POL-ADMIN",
        policy_version="1.0.0",
        reason=f"Administrator '{admin_user.username}' resolved tamper alert {alert_id}: {alert.resolution_note}",
        execution_mode="SYSTEM_ADMIN",
        execution_status="EXECUTED",
        approval_status="NONE",
        event_metadata=json.dumps({"alert_id": alert_id, "resolved_by": admin_user.username, "note": alert.resolution_note}),
        integrity_hash=hash_to_bytes32_hex(compute_canonical_event_hash(
            event_id=admin_evt_id,
            timestamp=now_utc,
            agent_id="admin-security-operations",
            action_type="ADMIN_SECURITY_ALERT_RESOLVE",
            resource=f"alerts/{alert_id}",
            policy_decision="ALLOW",
            policy_id="POL-ADMIN",
            policy_version="1.0.0",
            reason=f"Administrator '{admin_user.username}' resolved tamper alert {alert_id}: {alert.resolution_note}",
            execution_mode="SYSTEM_ADMIN"
        ))
    )
    db.add(res_evt)
    db.commit()
    db.refresh(alert)

    return TamperAlertResponse.model_validate(alert)

@router.post("/simulate-tamper")
def simulate_tampering_for_demo(
    payload: Optional[SimulateTamperRequest] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Demo/Judges testing endpoint:
    Modifies an audit event's database fields (e.g. changing resource to an unauthorized file)
    WITHOUT recalculating the canonical hash or updating on-chain anchors.
    Then immediately invokes the integrity verifier to prove instant tamper detection!
    """
    event = None
    if payload and payload.event_id:
        event = db.query(AuditEvent).filter(AuditEvent.id == payload.event_id).first()
    
    if not event:
        # Choose the most recent non-tampered event
        event = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()

    if not event:
        raise HTTPException(status_code=400, detail="No audit events available to tamper.")

    # Save original resource in metadata if not already saved
    meta = json.loads(event.event_metadata or "{}")
    if "original_resource" not in meta:
        meta["original_resource"] = event.resource
        meta["original_reason"] = event.reason
        event.event_metadata = json.dumps(meta)

    # Apply unauthorized mutation directly to database record
    tampered_str = payload.tampered_resource if (payload and payload.tampered_resource) else f"{event.resource} [TAMPERED_BY_ATTACKER]"
    event.resource = tampered_str
    event.reason = f"{event.reason} (Malicious attacker injected payload bypass)"
    db.commit()

    # Run verification to produce tamper detection
    verification = IntegrityVerifier.verify_event(event.id, db)

    return {
        "status": "TAMPER_SIMULATED",
        "event_id": event.id,
        "modified_resource": event.resource,
        "verification_result": verification.to_dict(),
        "instruction": "The record was modified in the database. Verifier detected the cryptographic divergence against the stored canonical SHA-256 hash."
    }

@router.post("/restore-tamper")
def restore_tampered_event_for_demo(
    event_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Restores a tampered demo event back to its original canonical state.
    """
    query = db.query(AuditEvent)
    if event_id:
        query = query.filter(AuditEvent.id == event_id)
    events = query.all()

    restored_count = 0
    for evt in events:
        meta = json.loads(evt.event_metadata or "{}")
        if "original_resource" in meta:
            evt.resource = meta["original_resource"]
            evt.reason = meta.get("original_reason", evt.reason)
            del meta["original_resource"]
            if "original_reason" in meta:
                del meta["original_reason"]
            evt.event_metadata = json.dumps(meta)
            restored_count += 1
            # Re-verify
            IntegrityVerifier.verify_event(evt.id, db)

    db.commit()
    return {
        "status": "RESTORED",
        "restored_records_count": restored_count,
        "message": "Tampered events successfully restored to canonical states."
    }

