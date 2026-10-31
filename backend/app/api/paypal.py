import uuid
import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import AuditEvent, IntegrityRecord, Agent
from app.services.paypal_service import paypal_sandbox_service
from app.integrity.canonical import (
    CanonicalAuditEvent,
    compute_canonical_event_hash,
    hash_to_bytes32_hex,
    CANONICAL_VERSION,
    HASH_ALGORITHM
)

router = APIRouter(prefix="/paypal", tags=["PayPal Sandbox Governance"])

class PayPalOrderRequest(BaseModel):
    agent_id: str = Field(..., description="The AI Agent requesting the payment")
    recipient: str = Field(..., description="Destination recipient or vendor account")
    amount: float = Field(..., gt=0, description="Amount to transfer in selected currency")
    currency: str = Field("USD", description="Currency ISO code")
    description: Optional[str] = "Governed AI Agent payment transaction"

class PayPalCaptureRequest(BaseModel):
    order_id: str
    approval_event_id: Optional[str] = None

@router.get("/status")
def get_paypal_status():
    """Returns PayPal Sandbox integration and connection diagnostics."""
    return paypal_sandbox_service.get_status()

@router.post("/governed-order")
def create_governed_paypal_order(
    req: PayPalOrderRequest,
    db: Session = Depends(get_db)
):
    """
    Zero-Trust Gated PayPal Sandbox Order Creation:
    1. Action evaluated by SentinelMesh policy engine.
    2. ALLOW -> Calls PayPal Sandbox API to create checkout order.
    3. REQUIRE_APPROVAL -> Holds order in pending approval state until signed off.
    4. BLOCK -> Denies action before any payment request reaches PayPal.
    """
    resource = f"paypal://orders/{req.recipient}"
    action_type = "PAYMENT"

    # Fetch agent permissions if registered
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    agent_perms = []
    if agent and agent.permissions:
        try:
            agent_perms = json.loads(agent.permissions)
        except Exception:
            pass

    # 1. Deterministic Policy Evaluation
    if req.amount > 100.0 and "admin" not in agent_perms:
        decision = "REQUIRE_APPROVAL"
        policy_id = "POL-PAYPAL-HIGH"
        policy_name = "High-Value Payment Authorization Gate"
        reason = f"Payment amount of ${req.amount:.2f} {req.currency} exceeds auto-approval threshold ($100.00). Human multi-factor authorization required."
    elif req.recipient.lower() in {"sanctioned_entity", "blocked_merchant", "untrusted_wallet"}:
        decision = "BLOCK"
        policy_id = "POL-PAYPAL-BLOCKED"
        policy_name = "Sanctioned Entity Payment Shield"
        reason = f"Payment to recipient '{req.recipient}' is strictly prohibited by anti-fraud policy."
    else:
        decision = "ALLOW"
        policy_id = "POL-PAYPAL-LOW"
        policy_name = "Autonomous Micro-Payment Allowance"
        reason = f"Micro-payment of ${req.amount:.2f} {req.currency} authorized under policy."

    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    now_utc = datetime.datetime.now(datetime.timezone.utc)

    # Compute RFC 8785 Canonical Event Hash
    canonical_obj = CanonicalAuditEvent(
        event_id=event_id,
        timestamp=now_utc,
        agent_id=req.agent_id,
        action_type=action_type,
        resource=resource,
        policy_decision=decision,
        policy_id=policy_id,
        policy_version="1.0.0",
        reason=reason,
        execution_mode="SIMULATED",
        parameters={
            "amount": req.amount,
            "currency": req.currency,
            "recipient": req.recipient,
            "provider": "PAYPAL_SANDBOX"
        }
    )
    raw_hash_bytes = canonical_obj.compute_hash()
    formatted_hash = hash_to_bytes32_hex(raw_hash_bytes)
    sha256_digest = formatted_hash[2:] if formatted_hash.startswith("0x") else formatted_hash

    # 2. Handle Decision Branches
    if decision == "BLOCK":
        event = AuditEvent(
            id=event_id,
            timestamp=now_utc,
            agent_id=req.agent_id,
            action_type=action_type,
            resource=resource,
            policy_decision=decision,
            policy_id=policy_id,
            policy_version="1.0.0",
            reason=reason,
            execution_mode="SIMULATED",
            execution_status="BLOCKED",
            approval_status="NONE",
            integrity_hash=formatted_hash,
            event_metadata=canonical_obj.serialize().decode('utf-8')
        )
        db.add(event)

        integrity_rec = IntegrityRecord(
            id=f"int_{event_id}",
            event_id=event_id,
            hash_algorithm=HASH_ALGORITHM,
            canonical_version=CANONICAL_VERSION,
            event_hash=formatted_hash,
            anchoring_status="NOT_ANCHORED",
            verification_status="INTACT",
            last_verified_at=now_utc
        )
        db.add(integrity_rec)
        db.commit()

        return {
            "success": False,
            "decision": "BLOCK",
            "policy_id": policy_id,
            "reason": reason,
            "event_id": event_id,
            "sha256_digest": sha256_digest,
            "canonical_hash": formatted_hash,
            "paypal_status": "NOT_CALLED_POLICY_BLOCKED"
        }

    if decision == "REQUIRE_APPROVAL":
        event = AuditEvent(
            id=event_id,
            timestamp=now_utc,
            agent_id=req.agent_id,
            action_type=action_type,
            resource=resource,
            policy_decision=decision,
            policy_id=policy_id,
            policy_version="1.0.0",
            reason=reason,
            execution_mode="SIMULATED",
            execution_status="PENDING_APPROVAL",
            approval_status="PENDING",
            integrity_hash=formatted_hash,
            event_metadata=canonical_obj.serialize().decode('utf-8')
        )
        db.add(event)

        integrity_rec = IntegrityRecord(
            id=f"int_{event_id}",
            event_id=event_id,
            hash_algorithm=HASH_ALGORITHM,
            canonical_version=CANONICAL_VERSION,
            event_hash=formatted_hash,
            anchoring_status="NOT_ANCHORED",
            verification_status="INTACT",
            last_verified_at=now_utc
        )
        db.add(integrity_rec)
        db.commit()

        return {
            "success": False,
            "decision": "REQUIRE_APPROVAL",
            "policy_id": policy_id,
            "reason": reason,
            "event_id": event_id,
            "sha256_digest": sha256_digest,
            "canonical_hash": formatted_hash,
            "paypal_status": "HELD_PENDING_HUMAN_APPROVAL",
            "instruction": "Transaction recorded in Approval Center. Authorize this payment in /approvals before capture can occur."
        }

    # 3. ALLOW -> Invoke PayPal Sandbox API
    paypal_res = paypal_sandbox_service.create_order(
        amount=req.amount,
        currency=req.currency,
        reference_id=event_id,
        description=req.description or "SentinelMesh Policy-Governed Payment"
    )

    execution_status = "EXECUTED_SIMULATED" if not paypal_res.get("success") else "COMPLETED_PAYPAL_SANDBOX"

    event = AuditEvent(
        id=event_id,
        timestamp=now_utc,
        agent_id=req.agent_id,
        action_type=action_type,
        resource=resource,
        policy_decision=decision,
        policy_id=policy_id,
        policy_version="1.0.0",
        reason=reason,
        execution_mode="SIMULATED" if not paypal_res.get("success") else "LIVE_SANDBOX",
        execution_status=execution_status,
        approval_status="NONE",
        integrity_hash=formatted_hash,
        event_metadata=canonical_obj.serialize().decode('utf-8')
    )
    db.add(event)

    integrity_rec = IntegrityRecord(
        id=f"int_{event_id}",
        event_id=event_id,
        hash_algorithm=HASH_ALGORITHM,
        canonical_version=CANONICAL_VERSION,
        event_hash=formatted_hash,
        anchoring_status="NOT_ANCHORED",
        verification_status="INTACT",
        last_verified_at=now_utc
    )
    db.add(integrity_rec)
    db.commit()

    return {
        "success": True,
        "decision": "ALLOW",
        "policy_id": policy_id,
        "reason": reason,
        "event_id": event_id,
        "sha256_digest": sha256_digest,
        "canonical_hash": formatted_hash,
        "paypal_result": paypal_res
    }

@router.post("/capture/{order_id}")
def capture_paypal_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Captures a pre-authorized PayPal Sandbox checkout order."""
    res = paypal_sandbox_service.capture_order(order_id)
    return res
