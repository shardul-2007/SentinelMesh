import csv
import io
import json
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import AuditEvent, IntegrityRecord, TamperAlert, User
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/reports", tags=["Analytics & Reporting"])

@router.get("/analytics")
def get_security_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns data-driven security analytics derived strictly from persisted database records.
    Never fabricates metrics.
    """
    # 1. Total event stats
    total_events = db.query(AuditEvent).count()
    allowed_count = db.query(AuditEvent).filter(AuditEvent.policy_decision == "ALLOW").count()
    blocked_count = db.query(AuditEvent).filter(AuditEvent.policy_decision == "BLOCK").count()
    approval_count = db.query(AuditEvent).filter(AuditEvent.policy_decision == "REQUIRE_APPROVAL").count()

    # 2. Decisions by action category
    action_stats = (
        db.query(AuditEvent.action_type, func.count(AuditEvent.id))
        .group_by(AuditEvent.action_type)
        .all()
    )
    actions_distribution = {action: count for action, count in action_stats}

    # 3. Agent activity summaries
    agent_stats = (
        db.query(AuditEvent.agent_id, func.count(AuditEvent.id))
        .group_by(AuditEvent.agent_id)
        .order_by(func.count(AuditEvent.id).desc())
        .limit(10)
        .all()
    )
    agents_distribution = [{"agent_id": a[0], "event_count": a[1]} for a in agent_stats]

    # 4. Integrity verification outcomes
    integrity_records = db.query(IntegrityRecord).all()
    integrity_stats = {
        "INTACT": 0,
        "ANCHORED_AND_VERIFIED": 0,
        "TAMPERED": 0,
        "NOT_ANCHORED": 0,
        "VERIFICATION_UNAVAILABLE": 0
    }
    anchored_total = 0
    for rec in integrity_records:
        if rec.verification_status in integrity_stats:
            integrity_stats[rec.verification_status] += 1
        if rec.anchoring_status == "ANCHORED":
            anchored_total += 1

    # 5. Tamper alerts count
    open_alerts = db.query(TamperAlert).filter(TamperAlert.status == "OPEN").count()
    resolved_alerts = db.query(TamperAlert).filter(TamperAlert.status == "RESOLVED").count()

    return {
        "summary": {
            "total_events": total_events,
            "allowed": allowed_count,
            "blocked": blocked_count,
            "require_approval": approval_count,
            "total_anchored": anchored_total,
            "open_tamper_alerts": open_alerts,
            "resolved_tamper_alerts": resolved_alerts
        },
        "action_distribution": actions_distribution,
        "agent_activity": agents_distribution,
        "integrity_breakdown": integrity_stats
    }

def sanitize_csv_cell(val: Any) -> Any:
    """Neutralize spreadsheet formula injection risks for exported values."""
    if isinstance(val, str) and val.startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{val}"
    return val

@router.get("/export")
def export_audit_report(
    format: str = Query("json", pattern="^(json|csv)$"),
    decision: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    integrity_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"]))
):
    """
    Exports authorized compliance audit reports in CSV or JSON format.
    Requires ADMIN or SECURITY_ANALYST role.
    Excludes sensitive secrets, tokens, and credentials.
    """
    query = db.query(AuditEvent)

    if decision:
        query = query.filter(AuditEvent.policy_decision == decision.upper())
    if agent_id:
        query = query.filter(AuditEvent.agent_id == agent_id)
    if integrity_status:
        query = query.join(AuditEvent.integrity_record).filter(IntegrityRecord.verification_status == integrity_status.upper())

    events = query.order_by(AuditEvent.timestamp.desc()).all()

    # Build clean serializable list
    data = []
    for evt in events:
        int_rec = evt.integrity_record
        data.append({
            "event_id": evt.id,
            "timestamp": evt.timestamp.isoformat() if evt.timestamp else None,
            "agent_id": evt.agent_id,
            "action_type": evt.action_type,
            "resource": evt.resource,
            "policy_decision": evt.policy_decision,
            "policy_id": evt.policy_id,
            "policy_version": evt.policy_version,
            "execution_status": evt.execution_status,
            "execution_mode": evt.execution_mode,
            "reason": evt.reason,
            "integrity_hash": evt.integrity_hash,
            "anchoring_status": int_rec.anchoring_status if int_rec else "NOT_ANCHORED",
            "verification_status": int_rec.verification_status if int_rec else "UNVERIFIED",
            "transaction_hash": int_rec.transaction_hash if int_rec else None,
            "block_number": int_rec.block_number if int_rec else None
        })

    filename_timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")

    if format == "json":
        json_content = json.dumps({
            "report_name": "SentinelMesh Audit Trail Export",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "generated_by": current_user.username,
            "total_records": len(data),
            "records": data
        }, indent=2)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=sentinelmesh_audit_report_{filename_timestamp}.json"
            }
        )

    # CSV Format
    output = io.StringIO()
    if data:
        sanitized_data = [
            {k: sanitize_csv_cell(v) for k, v in row.items()}
            for row in data
        ]
        writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
        writer.writeheader()
        writer.writerows(sanitized_data)
    else:
        output.write("event_id,timestamp,agent_id,action_type,resource,policy_decision,integrity_hash\n")

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=sentinelmesh_audit_report_{filename_timestamp}.csv"
        }
    )
