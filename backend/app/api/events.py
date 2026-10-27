from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List
from app.database import get_db
from app.models import AuditEvent
from app.schemas import AuditEventListResponse, AuditEventSummary, AuditEventDetail

router = APIRouter(prefix="/api/events", tags=["Audit Events"])

@router.get("", response_model=AuditEventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    decision: Optional[str] = Query(None, description="Filter by decision: ALLOW, BLOCK, REQUIRE_APPROVAL"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    search: Optional[str] = Query(None, description="Search term for resource or reason"),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)

    if isinstance(decision, str) and decision.upper() != "ALL":
        query = query.filter(AuditEvent.policy_decision == decision.upper())

    if isinstance(agent_id, str) and agent_id.strip():
        query = query.filter(AuditEvent.agent_id == agent_id.strip())

    if isinstance(search, str) and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditEvent.resource.ilike(term),
                AuditEvent.reason.ilike(term),
                AuditEvent.action_type.ilike(term),
                AuditEvent.id.ilike(term)
            )
        )

    total = query.count()
    events_raw = (
        query.order_by(desc(AuditEvent.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    events = [AuditEventSummary.model_validate(e) for e in events_raw]

    return AuditEventListResponse(
        total=total,
        page=page,
        page_size=page_size,
        events=events
    )

@router.get("/{event_id}", response_model=AuditEventDetail)
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Audit event with ID '{event_id}' not found")

    approval_info = None
    if event.approval_decision:
        approval_info = {
            "decision": event.approval_decision.decision,
            "approver_id": event.approval_decision.approver_id,
            "note": event.approval_decision.note,
            "decided_at": event.approval_decision.decided_at.isoformat() if event.approval_decision.decided_at else None
        }

    integrity_info = None
    if event.integrity_record:
        integrity_info = {
            "id": event.integrity_record.id,
            "hash_algorithm": event.integrity_record.hash_algorithm,
            "canonical_version": event.integrity_record.canonical_version,
            "event_hash": event.integrity_record.event_hash,
            "blockchain_network": event.integrity_record.blockchain_network,
            "chain_id": event.integrity_record.chain_id,
            "contract_address": event.integrity_record.contract_address,
            "transaction_hash": event.integrity_record.transaction_hash,
            "block_number": event.integrity_record.block_number,
            "anchoring_status": event.integrity_record.anchoring_status,
            "anchored_at": event.integrity_record.anchored_at.isoformat() if event.integrity_record.anchored_at else None,
            "verification_status": event.integrity_record.verification_status,
            "last_verified_at": event.integrity_record.last_verified_at.isoformat() if event.integrity_record.last_verified_at else None
        }

    return AuditEventDetail(
        id=event.id,
        request_id=event.request_id,
        timestamp=event.timestamp,
        agent_id=event.agent_id,
        action_type=event.action_type,
        resource=event.resource,
        policy_decision=event.policy_decision,
        policy_id=event.policy_id,
        policy_version=event.policy_version,
        reason=event.reason,
        execution_mode=event.execution_mode,
        execution_status=event.execution_status,
        approval_status=event.approval_status,
        event_metadata=event.event_metadata,
        integrity_hash=event.integrity_hash,
        previous_event_hash=event.previous_event_hash,
        approval_decision=approval_info,
        integrity_record=integrity_info
    )
