"""
SentinelMesh Threat Intelligence & Detection API Routes
Phase 6
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
from app.models import (
    User, Agent, AuditEvent, IntegrityRecord, TamperAlert,
    SecurityFinding, FindingAuditLog, DetectionRun, SecurityPolicy
)
from app.schemas import (
    SecurityFindingResponse, SecurityFindingDetailResponse,
    FindingStatusUpdateRequest, FindingAuditLogResponse,
    DetectionRuleResponse, AgentTrustProfileResponse,
    ThreatAnalyticsResponse, LabScenarioRunRequest, LabScenarioRunResponse,
    AuditEventDetail
)
from app.threats.rules import get_registered_rules, get_rule_by_id
from app.threats.engine import ThreatDetectionEngine
from app.threats.risk_scorer import calculate_agent_risk_score
from app.threats.lab import ThreatSimulationLab, PREDEFINED_SCENARIOS

threats_router = APIRouter(prefix="/api/threats", tags=["Threat Detection & Intelligence"])


@threats_router.get("/rules", response_model=List[DetectionRuleResponse])
def list_detection_rules(
    current_user: User = Depends(get_current_user)
):
    """
    Returns all registered, deterministic threat detection rules and thresholds.
    """
    rules = get_registered_rules()
    return [
        DetectionRuleResponse(
            rule_id=r.rule_id,
            name=r.name,
            version=r.version,
            severity=r.severity,
            description=r.description,
            window_minutes=r.window_minutes,
            threshold=r.threshold,
            recommended_action=r.recommended_action,
            is_enabled=r.is_enabled
        )
        for r in rules
    ]


@threats_router.post("/analyze")
def trigger_detection_analysis(
    agent_id: Optional[str] = Query(None, description="Optional agent ID filter"),
    include_simulation: bool = Query(False, description="Whether to include simulation events"),
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Executes behavioral threat detection over recent audit events.
    Idempotent: prevents duplicate findings for the same evidence window.
    """
    engine = ThreatDetectionEngine(db)
    result = engine.run_detection(
        agent_id=agent_id,
        include_simulation=include_simulation,
        triggered_by=f"USER:{current_user.username}"
    )
    return {
        "status": "COMPLETED",
        "run_id": result["run_id"],
        "agents_evaluated": result["agents_evaluated"],
        "new_findings_generated": result["findings_generated"],
        "timestamp": result["run_timestamp"].isoformat()
    }


@threats_router.get("/findings", response_model=List[SecurityFindingResponse])
def list_findings(
    agent_id: Optional[str] = Query(None),
    rule_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_simulation: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns filtered security findings with pagination.
    """
    query = db.query(SecurityFinding)

    if agent_id:
        query = query.filter(SecurityFinding.agent_id == agent_id)
    if rule_id:
        query = query.filter(SecurityFinding.rule_id == rule_id)
    if severity:
        query = query.filter(SecurityFinding.severity == severity.upper())
    if status:
        query = query.filter(SecurityFinding.status == status.upper())
    if is_simulation is not None:
        query = query.filter(SecurityFinding.is_simulation == is_simulation)

    findings = query.order_by(desc(SecurityFinding.detected_at)).offset(offset).limit(limit).all()

    result = []
    for f in findings:
        try:
            ev_ids = json.loads(f.evidence_event_ids) if f.evidence_event_ids else []
        except Exception:
            ev_ids = []
        try:
            meta = json.loads(f.finding_metadata) if f.finding_metadata else {}
        except Exception:
            meta = {}

        result.append(
            SecurityFindingResponse(
                id=f.id,
                finding_id=f.finding_id or f.id,
                rule_id=f.rule_id,
                rule_version=f.rule_version,
                agent_id=f.agent_id,
                severity=f.severity,
                status=f.status,
                title=f.title,
                description=f.description,
                recommended_action=f.recommended_action,
                evidence_event_ids=ev_ids,
                detected_at=f.detected_at,
                is_simulation=f.is_simulation,
                resolved_at=f.resolved_at,
                resolved_by=f.resolved_by,
                resolution_notes=f.resolution_notes,
                finding_metadata=meta
            )
        )
    return result


@threats_router.get("/findings/{finding_id}", response_model=SecurityFindingDetailResponse)
def get_finding_detail(
    finding_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns comprehensive details for a finding, including linked evidence AuditEvents and audit trail.
    """
    finding = db.query(SecurityFinding).filter(
        (SecurityFinding.id == finding_id) | (SecurityFinding.finding_id == finding_id)
    ).first()

    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found.")

    try:
        ev_ids = json.loads(finding.evidence_event_ids) if finding.evidence_event_ids else []
    except Exception:
        ev_ids = []
    try:
        meta = json.loads(finding.finding_metadata) if finding.finding_metadata else {}
    except Exception:
        meta = {}

    # Query linked evidence events
    evidence_events = []
    if ev_ids:
        events = db.query(AuditEvent).filter(AuditEvent.id.in_(ev_ids)).all()
        for e in events:
            evidence_events.append(
                AuditEventDetail(
                    id=e.id,
                    timestamp=e.timestamp,
                    agent_id=e.agent_id,
                    action_type=e.action_type,
                    resource=e.resource,
                    policy_decision=e.policy_decision,
                    policy_id=e.policy_id,
                    policy_version=e.policy_version,
                    reason=e.reason,
                    execution_mode=e.execution_mode,
                    execution_status=e.execution_status,
                    approval_status=e.approval_status,
                    event_metadata=e.event_metadata,
                    integrity_hash=e.integrity_hash,
                    previous_event_hash=e.previous_event_hash
                )
            )

    # Query audit logs
    audit_logs = [
        FindingAuditLogResponse(
            id=l.id,
            finding_id=l.finding_id,
            action=l.action,
            previous_status=l.previous_status,
            new_status=l.new_status,
            performed_by=l.performed_by,
            notes=l.notes,
            timestamp=l.timestamp
        )
        for l in finding.audit_logs
    ]

    return SecurityFindingDetailResponse(
        id=finding.id,
        finding_id=finding.finding_id or finding.id,
        rule_id=finding.rule_id,
        rule_version=finding.rule_version,
        agent_id=finding.agent_id,
        severity=finding.severity,
        status=finding.status,
        title=finding.title,
        description=finding.description,
        recommended_action=finding.recommended_action,
        evidence_event_ids=ev_ids,
        detected_at=finding.detected_at,
        is_simulation=finding.is_simulation,
        resolved_at=finding.resolved_at,
        resolved_by=finding.resolved_by,
        resolution_notes=finding.resolution_notes,
        finding_metadata=meta,
        evidence_events=evidence_events,
        audit_logs=audit_logs
    )


@threats_router.post("/findings/{finding_id}/status")
def update_finding_status(
    finding_id: str,
    payload: FindingStatusUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Updates status of a security finding (INVESTIGATING, RESOLVED, FALSE_POSITIVE)
    and records an immutable audit log entry.
    """
    finding = db.query(SecurityFinding).filter(
        (SecurityFinding.id == finding_id) | (SecurityFinding.finding_id == finding_id)
    ).first()

    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found.")

    prev_status = finding.status
    new_status = payload.status.value
    now_utc = datetime.now(timezone.utc)

    finding.status = new_status
    if new_status in ["RESOLVED", "FALSE_POSITIVE"]:
        finding.resolved_at = now_utc
        finding.resolved_by = current_user.username
        finding.resolution_notes = payload.notes
    elif new_status == "INVESTIGATING":
        finding.resolved_at = None
        finding.resolved_by = None
        finding.resolution_notes = payload.notes

    # Create audit log entry
    audit_log = FindingAuditLog(
        id=f"flog_{int(now_utc.timestamp())}_{uuid.uuid4().hex[:8]}",
        finding_id=finding.id,
        action="STATUS_CHANGE",
        previous_status=prev_status,
        new_status=new_status,
        performed_by=current_user.username,
        notes=payload.notes,
        timestamp=now_utc
    )
    db.add(audit_log)
    db.commit()

    return {
        "status": "UPDATED",
        "finding_id": finding.finding_id or finding.id,
        "previous_status": prev_status,
        "new_status": new_status,
        "updated_by": current_user.username,
        "timestamp": now_utc.isoformat()
    }


@threats_router.get("/agent-profiles", response_model=List[AgentTrustProfileResponse])
def list_agent_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns trust profiles for all registered agents, detailing behavioral risk,
    cryptographic evidence integrity, and blockchain anchoring status.
    """
    agents = db.query(Agent).all()
    profiles = []

    for agent in agents:
        profiles.append(_build_agent_trust_profile(db, agent))

    return profiles


@threats_router.get("/agent-profiles/{agent_id}", response_model=AgentTrustProfileResponse)
def get_agent_profile(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the trust profile for a single agent with full risk score breakdown.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")

    return _build_agent_trust_profile(db, agent)


def _build_agent_trust_profile(db: Session, agent: Agent) -> AgentTrustProfileResponse:
    # Query events for agent
    events = db.query(AuditEvent).filter(AuditEvent.agent_id == agent.id).all()
    total_actions = len(events)
    allowed_actions = sum(1 for e in events if e.policy_decision == "ALLOW")
    blocked_actions = sum(1 for e in events if e.policy_decision == "BLOCK")
    approval_required = sum(1 for e in events if e.policy_decision == "REQUIRE_APPROVAL")
    blocked_ratio = blocked_actions / total_actions if total_actions > 0 else 0.0

    # Active findings count
    active_findings = db.query(SecurityFinding).filter(
        SecurityFinding.agent_id == agent.id,
        SecurityFinding.status.in_(["ACTIVE", "INVESTIGATING"])
    ).count()

    # Evidence integrity status
    event_ids = [e.id for e in events]
    tamper_alerts_count = db.query(TamperAlert).filter(
        TamperAlert.event_id.in_(event_ids) if event_ids else False
    ).count()

    if tamper_alerts_count > 0:
        integrity_status = "TAMPERED"
    elif total_actions > 0:
        integrity_status = "INTACT"
    else:
        integrity_status = "UNVERIFIED"

    # Blockchain anchoring status
    anchored_count = db.query(IntegrityRecord).filter(
        IntegrityRecord.event_id.in_(event_ids) if event_ids else False,
        IntegrityRecord.anchoring_status == "ANCHORED"
    ).count()

    if total_actions > 0 and anchored_count == total_actions:
        blockchain_status = "ANCHORED_AND_VERIFIED"
    elif anchored_count > 0:
        blockchain_status = "PARTIALLY_ANCHORED"
    else:
        blockchain_status = "NOT_ANCHORED"

    # Risk score calculation
    risk_breakdown = calculate_agent_risk_score(db, agent.id, window_hours=24)

    # Applicable policies
    policies = db.query(SecurityPolicy.id).filter(SecurityPolicy.is_active == True).all()
    policy_ids = [p[0] for p in policies]

    last_event = db.query(AuditEvent).filter(AuditEvent.agent_id == agent.id).order_by(desc(AuditEvent.timestamp)).first()
    last_act = last_event.timestamp if last_event else None

    return AgentTrustProfileResponse(
        agent_id=agent.id,
        agent_name=agent.name,
        role=agent.role,
        status=agent.status,
        total_actions=total_actions,
        allowed_actions=allowed_actions,
        blocked_actions=blocked_actions,
        approval_required_actions=approval_required,
        blocked_ratio=round(blocked_ratio, 3),
        violations_count=blocked_actions,
        active_findings_count=active_findings,
        integrity_failures_count=tamper_alerts_count,
        last_activity_timestamp=last_act,
        behavioral_risk_tier=risk_breakdown["risk_tier"],
        evidence_integrity_status=integrity_status,
        blockchain_anchoring_status=blockchain_status,
        risk_score_breakdown=risk_breakdown,
        applicable_policies=policy_ids
    )


@threats_router.get("/analytics", response_model=ThreatAnalyticsResponse)
def get_threat_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregate intelligence metrics for security dashboards.
    """
    all_findings = db.query(SecurityFinding).all()
    total_findings = len(all_findings)
    active = sum(1 for f in all_findings if f.status == "ACTIVE")
    investigating = sum(1 for f in all_findings if f.status == "INVESTIGATING")
    resolved = sum(1 for f in all_findings if f.status == "RESOLVED")
    false_positives = sum(1 for f in all_findings if f.status == "FALSE_POSITIVE")

    # Severity distribution
    severity_map = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in all_findings:
        sev = f.severity.upper()
        if sev in severity_map:
            severity_map[sev] += 1

    # Top triggered rules
    rule_counts = {}
    for f in all_findings:
        rule_counts[f.rule_id] = rule_counts.get(f.rule_id, 0) + 1

    top_rules = [
        {"rule_id": r_id, "count": count, "name": get_rule_by_id(r_id).name if get_rule_by_id(r_id) else r_id}
        for r_id, count in sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    # Agents under review (have active or investigating findings)
    agents_review = list(set([
        f.agent_id for f in all_findings
        if f.status in ["ACTIVE", "INVESTIGATING"] and f.severity in ["HIGH", "CRITICAL"]
    ]))

    # Last detection run
    last_run = db.query(DetectionRun).order_by(desc(DetectionRun.run_timestamp)).first()

    return ThreatAnalyticsResponse(
        total_findings=total_findings,
        active_findings=active,
        investigating_findings=investigating,
        resolved_findings=resolved,
        false_positives=false_positives,
        findings_by_severity=severity_map,
        top_triggered_rules=top_rules,
        agents_under_review=agents_review,
        last_detection_run=last_run.run_timestamp if last_run else None,
        rules_registered=len(get_registered_rules())
    )


@threats_router.post("/lab/run-scenario", response_model=LabScenarioRunResponse)
def run_lab_scenario(
    payload: LabScenarioRunRequest,
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Executes a predefined testing scenario in an isolated simulation environment.
    Negative controls (SCENARIO_NORMAL) confirm benign actions do not trigger findings.
    """
    lab = ThreatSimulationLab(db)
    try:
        result = lab.run_scenario(payload.scenario_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    findings_resp = []
    for f in result["findings"]:
        try:
            ev_ids = json.loads(f.evidence_event_ids) if f.evidence_event_ids else []
        except Exception:
            ev_ids = []
        try:
            meta = json.loads(f.finding_metadata) if f.finding_metadata else {}
        except Exception:
            meta = {}

        findings_resp.append(
            SecurityFindingResponse(
                id=f.id,
                finding_id=f.finding_id or f.id,
                rule_id=f.rule_id,
                rule_version=f.rule_version,
                agent_id=f.agent_id,
                severity=f.severity,
                status=f.status,
                title=f.title,
                description=f.description,
                recommended_action=f.recommended_action,
                evidence_event_ids=ev_ids,
                detected_at=f.detected_at,
                is_simulation=f.is_simulation,
                resolved_at=f.resolved_at,
                resolved_by=f.resolved_by,
                resolution_notes=f.resolution_notes,
                finding_metadata=meta
            )
        )

    return LabScenarioRunResponse(
        scenario_id=result["scenario_id"],
        scenario_name=result["scenario_name"],
        description=result["description"],
        actions_evaluated=result["actions_evaluated"],
        findings_triggered=result["findings_triggered"],
        findings=findings_resp,
        explanation=result["explanation"]
    )


@threats_router.post("/lab/reset")
def reset_lab(
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Safely purges simulation lab data without touching real application audit evidence.
    """
    lab = ThreatSimulationLab(db)
    cleared = lab.reset_lab_data()
    return {
        "status": "RESET_SUCCESSFUL",
        "cleared_simulation_records": cleared,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
