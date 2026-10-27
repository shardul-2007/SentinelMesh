"""
SentinelMesh Incidents & Controlled Response API Routes
Phase 7
"""

import json
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import Agent, SecurityIncident, IncidentAuditLog, SecurityFinding, AuditEvent, User
from app.schemas import (
    SecurityIncidentResponse, SecurityIncidentDetailResponse,
    IncidentStatusUpdateRequest, IncidentQuarantineRequest,
    IncidentAnalyticsResponse, IncidentAuditLogResponse,
    SecurityFindingResponse, AuditEventDetail
)
from app.incidents.correlator import IncidentCorrelator
from app.monitoring.events import get_broadcaster

incidents_router = APIRouter(prefix="/api/incidents", tags=["Incidents & Response"])


@incidents_router.get("", response_model=List[SecurityIncidentResponse])
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns filtered security incidents with pagination.
    """
    query = db.query(SecurityIncident)
    if status and status != "ALL":
        query = query.filter(SecurityIncident.status == status.upper())
    if severity and severity != "ALL":
        query = query.filter(SecurityIncident.severity == severity.upper())
    if agent_id:
        query = query.filter(SecurityIncident.agent_id == agent_id)

    incidents = query.order_by(desc(SecurityIncident.created_at)).offset(offset).limit(limit).all()

    results = []
    for inc in incidents:
        try:
            f_ids = json.loads(inc.finding_ids) if inc.finding_ids else []
        except Exception:
            f_ids = []
        try:
            ev_ids = json.loads(inc.evidence_event_ids) if inc.evidence_event_ids else []
        except Exception:
            ev_ids = []

        results.append(
            SecurityIncidentResponse(
                id=inc.id,
                incident_id=inc.incident_id or inc.id,
                title=inc.title,
                summary=inc.summary,
                severity=inc.severity,
                status=inc.status,
                agent_id=inc.agent_id,
                correlation_rule=inc.correlation_rule,
                correlation_explanation=inc.correlation_explanation,
                finding_ids=f_ids,
                evidence_event_ids=ev_ids,
                assigned_to=inc.assigned_to,
                created_at=inc.created_at,
                updated_at=inc.updated_at,
                resolved_at=inc.resolved_at,
                resolved_by=inc.resolved_by,
                resolution_summary=inc.resolution_summary
            )
        )
    return results


@incidents_router.get("/{incident_id}", response_model=SecurityIncidentDetailResponse)
def get_incident_detail(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns complete incident details including correlated findings,
    supporting evidence events, and response audit logs.
    """
    inc = db.query(SecurityIncident).filter(
        (SecurityIncident.id == incident_id) | (SecurityIncident.incident_id == incident_id)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    try:
        f_ids = json.loads(inc.finding_ids) if inc.finding_ids else []
    except Exception:
        f_ids = []
    try:
        ev_ids = json.loads(inc.evidence_event_ids) if inc.evidence_event_ids else []
    except Exception:
        ev_ids = []

    # Correlated findings
    findings = []
    if f_ids:
        raw_findings = db.query(SecurityFinding).filter(SecurityFinding.id.in_(f_ids)).all()
        for rf in raw_findings:
            try:
                r_evs = json.loads(rf.evidence_event_ids) if rf.evidence_event_ids else []
            except Exception:
                r_evs = []
            findings.append(
                SecurityFindingResponse(
                    id=rf.id,
                    finding_id=rf.finding_id or rf.id,
                    rule_id=rf.rule_id,
                    rule_version=rf.rule_version,
                    agent_id=rf.agent_id,
                    severity=rf.severity,
                    status=rf.status,
                    title=rf.title,
                    description=rf.description,
                    recommended_action=rf.recommended_action,
                    evidence_event_ids=r_evs,
                    detected_at=rf.detected_at,
                    is_simulation=rf.is_simulation,
                    resolved_at=rf.resolved_at,
                    resolved_by=rf.resolved_by,
                    resolution_notes=rf.resolution_notes
                )
            )

    # Correlated audit events
    evidence_events = []
    if ev_ids:
        raw_events = db.query(AuditEvent).filter(AuditEvent.id.in_(ev_ids)).all()
        for re in raw_events:
            evidence_events.append(
                AuditEventDetail(
                    id=re.id,
                    timestamp=re.timestamp,
                    agent_id=re.agent_id,
                    action_type=re.action_type,
                    resource=re.resource,
                    policy_decision=re.policy_decision,
                    policy_id=re.policy_id,
                    policy_version=re.policy_version,
                    reason=re.reason,
                    execution_mode=re.execution_mode,
                    execution_status=re.execution_status,
                    approval_status=re.approval_status,
                    event_metadata=re.event_metadata,
                    integrity_hash=re.integrity_hash,
                    previous_event_hash=re.previous_event_hash
                )
            )

    # Audit logs
    audit_logs = [
        IncidentAuditLogResponse(
            id=l.id,
            incident_id=l.incident_id,
            action=l.action,
            previous_status=l.previous_status,
            new_status=l.new_status,
            performed_by=l.performed_by,
            notes=l.notes,
            timestamp=l.timestamp
        )
        for l in inc.audit_logs
    ]

    return SecurityIncidentDetailResponse(
        id=inc.id,
        incident_id=inc.incident_id or inc.id,
        title=inc.title,
        summary=inc.summary,
        severity=inc.severity,
        status=inc.status,
        agent_id=inc.agent_id,
        correlation_rule=inc.correlation_rule,
        correlation_explanation=inc.correlation_explanation,
        finding_ids=f_ids,
        evidence_event_ids=ev_ids,
        assigned_to=inc.assigned_to,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        resolved_at=inc.resolved_at,
        resolved_by=inc.resolved_by,
        resolution_summary=inc.resolution_summary,
        findings=findings,
        evidence_events=evidence_events,
        audit_logs=audit_logs
    )


@incidents_router.post("/correlate")
def trigger_correlation(
    agent_id: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Executes the deterministic incident correlator to group active security findings.
    """
    correlator = IncidentCorrelator(db)
    incidents = correlator.run_correlation(agent_id=agent_id)
    return {
        "status": "COMPLETED",
        "new_incidents_created": len(incidents),
        "incidents": [i.incident_id for i in incidents]
    }


@incidents_router.post("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    payload: IncidentStatusUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Updates incident lifecycle status, investigator assignment, or adds resolution summary.
    """
    inc = db.query(SecurityIncident).filter(
        (SecurityIncident.id == incident_id) | (SecurityIncident.incident_id == incident_id)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    prev_status = inc.status
    now_utc = datetime.now(timezone.utc)
    inc.status = payload.status.value
    inc.updated_at = now_utc

    if payload.assigned_to is not None:
        inc.assigned_to = payload.assigned_to

    if payload.status.value in ["RESOLVED", "FALSE_POSITIVE"]:
        inc.resolved_at = now_utc
        inc.resolved_by = current_user.username
        inc.resolution_summary = payload.notes

    # Add audit log
    audit_log = IncidentAuditLog(
        id=f"ilog_{int(now_utc.timestamp())}_{uuid.uuid4().hex[:8]}",
        incident_id=inc.id,
        action="STATUS_CHANGE",
        previous_status=prev_status,
        new_status=payload.status.value,
        performed_by=current_user.username,
        notes=payload.notes,
        timestamp=now_utc
    )
    db.add(audit_log)
    db.commit()

    get_broadcaster().publish_nowait("INCIDENT_UPDATED", {
        "incident_id": inc.incident_id,
        "new_status": inc.status,
        "updated_by": current_user.username
    })

    return {
        "status": "UPDATED",
        "incident_id": inc.incident_id,
        "previous_status": prev_status,
        "new_status": inc.status,
        "updated_by": current_user.username
    }


@incidents_router.post("/{incident_id}/quarantine-agent")
def quarantine_incident_agent(
    incident_id: str,
    payload: IncidentQuarantineRequest,
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Controlled containment action: Immediately transitions the agent's status
    to QUARANTINED, blocking all future action evaluations at the gateway.
    """
    inc = db.query(SecurityIncident).filter(
        (SecurityIncident.id == incident_id) | (SecurityIncident.incident_id == incident_id)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    agent = db.query(Agent).filter(Agent.id == inc.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{inc.agent_id}' not found.")

    now_utc = datetime.now(timezone.utc)
    prev_status = agent.status
    agent.status = "QUARANTINED"

    # Add audit log to incident
    audit_log = IncidentAuditLog(
        id=f"ilog_{int(now_utc.timestamp())}_{uuid.uuid4().hex[:8]}",
        incident_id=inc.id,
        action="AGENT_QUARANTINED",
        previous_status=prev_status,
        new_status="QUARANTINED",
        performed_by=current_user.username,
        notes=f"Containment executed: {payload.reason}",
        timestamp=now_utc
    )
    db.add(audit_log)
    db.commit()

    get_broadcaster().publish_nowait("AGENT_STATUS_CHANGED", {
        "agent_id": agent.id,
        "previous_status": prev_status,
        "new_status": "QUARANTINED",
        "incident_id": inc.incident_id,
        "reason": payload.reason,
        "performed_by": current_user.username
    })

    return {
        "status": "AGENT_QUARANTINED",
        "agent_id": agent.id,
        "incident_id": inc.incident_id,
        "performed_by": current_user.username,
        "reason": payload.reason,
        "timestamp": now_utc.isoformat()
    }


@incidents_router.get("/analytics/summary", response_model=IncidentAnalyticsResponse)
def get_incident_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns incident intelligence statistics for dashboard cards.
    """
    all_incidents = db.query(SecurityIncident).all()
    total = len(all_incidents)
    open_cnt = sum(1 for i in all_incidents if i.status == "OPEN")
    investigating_cnt = sum(1 for i in all_incidents if i.status == "INVESTIGATING")
    resolved_cnt = sum(1 for i in all_incidents if i.status == "RESOLVED")
    critical_cnt = sum(1 for i in all_incidents if i.severity == "CRITICAL" and i.status in ["OPEN", "INVESTIGATING"])

    quarantined = db.query(Agent).filter(Agent.status == "QUARANTINED").count()

    recent = db.query(SecurityIncident).order_by(desc(SecurityIncident.created_at)).limit(5).all()
    recent_responses = []
    for inc in recent:
        try:
            f_ids = json.loads(inc.finding_ids) if inc.finding_ids else []
        except Exception:
            f_ids = []
        try:
            ev_ids = json.loads(inc.evidence_event_ids) if inc.evidence_event_ids else []
        except Exception:
            ev_ids = []

        recent_responses.append(
            SecurityIncidentResponse(
                id=inc.id,
                incident_id=inc.incident_id or inc.id,
                title=inc.title,
                summary=inc.summary,
                severity=inc.severity,
                status=inc.status,
                agent_id=inc.agent_id,
                correlation_rule=inc.correlation_rule,
                correlation_explanation=inc.correlation_explanation,
                finding_ids=f_ids,
                evidence_event_ids=ev_ids,
                assigned_to=inc.assigned_to,
                created_at=inc.created_at,
                updated_at=inc.updated_at,
                resolved_at=inc.resolved_at,
                resolved_by=inc.resolved_by,
                resolution_summary=inc.resolution_summary
            )
        )

    return IncidentAnalyticsResponse(
        total_incidents=total,
        open_incidents=open_cnt,
        investigating_incidents=investigating_cnt,
        resolved_incidents=resolved_cnt,
        critical_incidents=critical_cnt,
        quarantined_agents_count=quarantined,
        recent_incidents=recent_responses
    )
