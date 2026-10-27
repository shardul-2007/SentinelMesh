from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
import datetime
from app.database import get_db
from app.models import AuditEvent, SecurityPolicy
from app.schemas import DashboardStatsResponse, AuditEventSummary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_events = db.query(AuditEvent).count()
    allowed_count = db.query(AuditEvent).filter(AuditEvent.policy_decision == "ALLOW").count()
    blocked_count = db.query(AuditEvent).filter(AuditEvent.policy_decision == "BLOCK").count()
    pending_approvals_count = db.query(AuditEvent).filter(
        AuditEvent.policy_decision == "REQUIRE_APPROVAL",
        AuditEvent.approval_status == "PENDING"
    ).count()

    recent_events_raw = (
        db.query(AuditEvent)
        .order_by(AuditEvent.timestamp.desc())
        .limit(8)
        .all()
    )
    recent_events = [AuditEventSummary.model_validate(e) for e in recent_events_raw]

    # Calculate events over the past 7 days for the activity chart
    now = datetime.datetime.utcnow()
    events_by_date: List[Dict[str, Any]] = []
    for i in range(6, -1, -1):
        day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + datetime.timedelta(days=1)
        count = db.query(AuditEvent).filter(
            AuditEvent.timestamp >= day_start,
            AuditEvent.timestamp < day_end
        ).count()
        allowed = db.query(AuditEvent).filter(
            AuditEvent.timestamp >= day_start,
            AuditEvent.timestamp < day_end,
            AuditEvent.policy_decision == "ALLOW"
        ).count()
        blocked = db.query(AuditEvent).filter(
            AuditEvent.timestamp >= day_start,
            AuditEvent.timestamp < day_end,
            AuditEvent.policy_decision == "BLOCK"
        ).count()
        events_by_date.append({
            "date": day_start.strftime("%b %d"),
            "total": count,
            "allowed": allowed,
            "blocked": blocked
        })

    return DashboardStatsResponse(
        total_events=total_events,
        allowed_count=allowed_count,
        blocked_count=blocked_count,
        pending_approvals_count=pending_approvals_count,
        system_status={
            "frontend": "OPERATIONAL",
            "backend": "OPERATIONAL",
            "database": "CONNECTED",
            "blockchain": "NOT CONNECTED"
        },
        recent_events=recent_events,
        events_by_date=events_by_date
    )
