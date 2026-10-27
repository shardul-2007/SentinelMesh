"""
SentinelMesh Autonomous Security Governance API Routes
Phase 8
"""

import json
import csv
import io
import uuid
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import (
    User, Agent, AuditEvent, IntegrityRecord, SecurityPolicy,
    PolicyVersionHistory, SecurityFinding, SecurityIncident, TamperAlert
)
from app.schemas import (
    GovernanceExplanationResponse, PolicyVersionHistoryResponse,
    PolicyUpdateRequest, GovernanceDashboardSummaryResponse
)
from app.governance.provenance import GovernanceProvenanceService
from app.monitoring.events import get_broadcaster

governance_router = APIRouter(prefix="/api/governance", tags=["Governance & Assurance"])


def sanitize_csv_cell(value: Any) -> str:
    """Neutralizes formula injection in CSV cells."""
    val_str = str(value) if value is not None else ""
    if val_str and val_str[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{val_str}"
    return val_str


@governance_router.get("/explain/{event_id}", response_model=GovernanceExplanationResponse)
def explain_governance_decision(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full provenance chain explanation for an action request,
    linking policy evaluation, persistent audit event, cryptographic hash,
    blockchain anchor status, and correlated security findings.
    """
    prov_service = GovernanceProvenanceService(db)
    result = prov_service.explain_event(event_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Governance provenance record for event '{event_id}' not found.")
    return result


@governance_router.get("/overview", response_model=GovernanceDashboardSummaryResponse)
def get_governance_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns centralized governance health, decision metrics, and assurance rates.
    """
    total_actions = db.query(AuditEvent).count()
    allowed = db.query(AuditEvent).filter(AuditEvent.policy_decision == "ALLOW").count()
    blocked = db.query(AuditEvent).filter(AuditEvent.policy_decision == "BLOCK").count()
    pending = db.query(AuditEvent).filter(AuditEvent.approval_status == "PENDING").count()

    total_policies = db.query(SecurityPolicy).count()
    total_versions = db.query(PolicyVersionHistory).count()

    active_findings = db.query(SecurityFinding).filter(SecurityFinding.status.in_(["ACTIVE", "INVESTIGATING"])).count()
    open_incidents = db.query(SecurityIncident).filter(SecurityIncident.status.in_(["OPEN", "INVESTIGATING"])).count()
    quarantined = db.query(Agent).filter(Agent.status == "QUARANTINED").count()

    total_irecs = db.query(IntegrityRecord).count()
    intact_irecs = db.query(IntegrityRecord).filter(IntegrityRecord.verification_status == "INTACT").count()
    anchored_irecs = db.query(IntegrityRecord).filter(IntegrityRecord.anchoring_status == "ANCHORED").count()

    integrity_rate = round((intact_irecs / total_irecs * 100), 1) if total_irecs > 0 else 100.0
    anchored_rate = round((anchored_irecs / total_irecs * 100), 1) if total_irecs > 0 else 0.0

    recent_events = db.query(AuditEvent).order_by(desc(AuditEvent.timestamp)).limit(5).all()
    recent_actions = [
        {
            "event_id": e.id,
            "agent_id": e.agent_id,
            "action_type": e.action_type,
            "resource": e.resource,
            "decision": e.policy_decision,
            "timestamp": e.timestamp.isoformat()
        }
        for e in recent_events
    ]

    return GovernanceDashboardSummaryResponse(
        total_evaluated_actions=total_actions,
        allowed_count=allowed,
        blocked_count=blocked,
        pending_approvals_count=pending,
        total_policies=total_policies,
        total_policy_versions=total_versions,
        active_threat_findings=active_findings,
        open_incidents=open_incidents,
        quarantined_agents=quarantined,
        cryptographic_integrity_rate=integrity_rate,
        blockchain_anchored_rate=anchored_rate,
        recent_governance_actions=recent_actions
    )


@governance_router.get("/policies/{policy_id}/history", response_model=List[PolicyVersionHistoryResponse])
def get_policy_version_history(
    policy_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full immutable version history of a policy for decision provenance.
    """
    history = db.query(PolicyVersionHistory).filter(
        PolicyVersionHistory.policy_id == policy_id
    ).order_by(desc(PolicyVersionHistory.created_at)).all()
    return history


@governance_router.post("/policies/{policy_id}/version", response_model=PolicyVersionHistoryResponse)
def update_policy_version(
    policy_id: str,
    payload: PolicyUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Updates a security policy and records an immutable version history entry.
    Historical decisions retain their previous version tags.
    """
    policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")

    # Parse version and increment
    try:
        parts = [int(p) for p in (policy.version or "1.0.0").split(".")]
        parts[-1] += 1
        new_version_str = ".".join(str(p) for p in parts)
    except Exception:
        new_version_str = f"{policy.version}.1"

    now_utc = datetime.now(timezone.utc)

    # Save previous version to history first
    history_entry = PolicyVersionHistory(
        id=f"pver_{policy.id}_{int(now_utc.timestamp())}",
        policy_id=policy.id,
        version=policy.version,
        name=policy.name,
        description=policy.description,
        action_pattern=policy.action_pattern,
        resource_pattern=policy.resource_pattern,
        decision=policy.decision,
        risk_tier=policy.risk_tier,
        changed_by=current_user.username,
        change_reason=payload.change_reason,
        created_at=now_utc
    )
    db.add(history_entry)

    # Apply updates to active policy
    if payload.name:
        policy.name = payload.name
    if payload.description:
        policy.description = payload.description
    if payload.decision:
        policy.decision = payload.decision.value
    if payload.risk_tier:
        policy.risk_tier = payload.risk_tier.value
    policy.version = new_version_str

    db.commit()
    db.refresh(history_entry)

    get_broadcaster().publish_nowait("POLICY_VERSION_UPDATED", {
        "policy_id": policy.id,
        "new_version": new_version_str,
        "changed_by": current_user.username,
        "reason": payload.change_reason
    })

    return history_entry


@governance_router.get("/report")
def export_governance_report(
    format: str = Query("json", pattern="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports a comprehensive audit and governance assurance report with full
    traceable provenance chains.
    """
    events = db.query(AuditEvent).order_by(desc(AuditEvent.timestamp)).limit(500).all()
    now_utc = datetime.now(timezone.utc)

    records = []
    for e in events:
        irec = db.query(IntegrityRecord).filter(IntegrityRecord.event_id == e.id).first()
        records.append({
            "event_id": e.id,
            "request_id": e.request_id or "N/A",
            "timestamp": e.timestamp.isoformat(),
            "agent_id": e.agent_id,
            "action_type": e.action_type,
            "resource": e.resource,
            "policy_id": e.policy_id,
            "policy_version": e.policy_version,
            "decision": e.policy_decision,
            "approval_status": e.approval_status,
            "integrity_hash": e.integrity_hash,
            "local_verification": irec.verification_status if irec else "UNVERIFIED",
            "anchoring_status": irec.anchoring_status if irec else "NOT_ANCHORED",
            "transaction_hash": (irec.transaction_hash if irec and irec.transaction_hash else "UNANCHORED")
        })

    if format == "csv":
        output = io.StringIO()
        fieldnames = [
            "event_id", "request_id", "timestamp", "agent_id", "action_type",
            "resource", "policy_id", "policy_version", "decision",
            "approval_status", "integrity_hash", "local_verification",
            "anchoring_status", "transaction_hash"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({k: sanitize_csv_cell(v) for k, v in r.items()})

        output.seek(0)
        filename = f"sentinelmesh_governance_report_{now_utc.strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    return {
        "report_id": f"gov_rep_{int(now_utc.timestamp())}",
        "generated_at": now_utc.isoformat(),
        "generated_by": current_user.username,
        "total_records": len(records),
        "records": records
    }
