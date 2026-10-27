"""
SentinelMesh Incident Correlation Engine
Phase 7: Deterministic Multi-Finding & Multi-Event Incident Aggregation
"""

import json
import hashlib
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import Agent, SecurityFinding, AuditEvent, SecurityIncident, IncidentAuditLog
from app.monitoring.events import get_broadcaster


class IncidentCorrelator:
    """
    Correlates related security findings and audit events into coherent,
    actionable security incidents for operators and incident responders.
    """
    def __init__(self, db: Session):
        self.db = db

    def generate_dedup_key(self, correlation_rule: str, agent_id: str, finding_ids: List[str]) -> str:
        sorted_ids = sorted(finding_ids)
        raw = f"{correlation_rule}:{agent_id}:{','.join(sorted_ids)}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]

    def run_correlation(self, agent_id: Optional[str] = None) -> List[SecurityIncident]:
        """
        Scans active security findings and correlates them into incidents.
        Can evaluate a specific agent or all agents with active findings.
        """
        if agent_id:
            agents = self.db.query(Agent).filter(Agent.id == agent_id).all()
        else:
            # Only agents with active findings
            agents_with_findings = self.db.query(SecurityFinding.agent_id).filter(
                SecurityFinding.status.in_(["ACTIVE", "INVESTIGATING"])
            ).distinct().all()
            agent_ids = [a[0] for a in agents_with_findings]
            agents = self.db.query(Agent).filter(Agent.id.in_(agent_ids)).all() if agent_ids else []

        created_incidents: List[SecurityIncident] = []
        for agent in agents:
            incidents = self._correlate_agent(agent)
            created_incidents.extend(incidents)

        return created_incidents

    def _correlate_agent(self, agent: Agent) -> List[SecurityIncident]:
        now_utc = datetime.now(timezone.utc)
        cutoff = now_utc - timedelta(hours=24)

        # Query active findings in the observation window
        findings = self.db.query(SecurityFinding).filter(
            SecurityFinding.agent_id == agent.id,
            SecurityFinding.status.in_(["ACTIVE", "INVESTIGATING"]),
            SecurityFinding.detected_at >= cutoff
        ).order_by(desc(SecurityFinding.detected_at)).all()

        if not findings:
            return []

        incidents: List[SecurityIncident] = []

        # 1. Multi-Finding Correlation (>= 2 active findings)
        if len(findings) >= 2:
            inc1 = self._correlate_multi_findings(agent, findings, now_utc)
            if inc1:
                incidents.append(inc1)

        # 2. Critical Severity Escalation (Any CRITICAL finding)
        critical_findings = [f for f in findings if f.severity == "CRITICAL"]
        for cf in critical_findings:
            inc2 = self._correlate_critical_finding(agent, cf, now_utc)
            if inc2:
                incidents.append(inc2)

        return incidents

    def _correlate_multi_findings(
        self,
        agent: Agent,
        findings: List[SecurityFinding],
        now_utc: datetime
    ) -> Optional[SecurityIncident]:
        correlation_rule = "AGENT_MULTI_FINDING_BURST"
        finding_ids = [f.id for f in findings]
        dedup_key = self.generate_dedup_key(correlation_rule, agent.id, finding_ids)

        # Check existing
        existing = self.db.query(SecurityIncident).filter(
            SecurityIncident.dedup_key == dedup_key
        ).first()
        if existing:
            return None

        # Collect underlying evidence events
        all_evidence_ids = []
        for f in findings:
            try:
                ev_ids = json.loads(f.evidence_event_ids) if f.evidence_event_ids else []
                all_evidence_ids.extend(ev_ids)
            except Exception:
                pass
        unique_evidence_ids = sorted(list(set(all_evidence_ids)))

        # Determine severity
        has_critical = any(f.severity == "CRITICAL" for f in findings)
        has_high = any(f.severity == "HIGH" for f in findings)
        severity = "CRITICAL" if has_critical else ("HIGH" if (has_high or len(findings) >= 3) else "MEDIUM")

        inc_uuid = hashlib.sha256(f"{dedup_key}:{now_utc.isoformat()}".encode()).hexdigest()[:8]
        incident_id_str = f"INC-{now_utc.strftime('%Y%m%d')}-{inc_uuid}"
        db_id = f"inc_{inc_uuid}"

        summary = (
            f"Correlated {len(findings)} active security findings for agent '{agent.id}' ({agent.name}). "
            f"Findings include: {', '.join([f.title for f in findings[:3]])}."
        )

        explanation = (
            f"Deterministic correlation triggered because agent accumulated {len(findings)} "
            f"distinct behavioral pattern alerts within a 24-hour observation window."
        )

        incident = SecurityIncident(
            id=db_id,
            incident_id=incident_id_str,
            title=f"Multi-Vector Behavioral Threat: {agent.name}",
            summary=summary,
            severity=severity,
            status="OPEN",
            agent_id=agent.id,
            correlation_rule=correlation_rule,
            correlation_explanation=explanation,
            finding_ids=json.dumps(finding_ids),
            evidence_event_ids=json.dumps(unique_evidence_ids),
            dedup_key=dedup_key,
            created_at=now_utc,
            updated_at=now_utc,
            metadata_json=json.dumps({
                "finding_count": len(findings),
                "rules_involved": list(set([f.rule_id for f in findings]))
            })
        )
        self.db.add(incident)

        # Initial audit log
        audit_log = IncidentAuditLog(
            id=f"ilog_{int(now_utc.timestamp())}_{uuid.uuid4().hex[:8]}",
            incident_id=db_id,
            action="CREATED",
            previous_status=None,
            new_status="OPEN",
            performed_by="INCIDENT_CORRELATOR",
            notes=f"Automated incident created correlating {len(findings)} findings.",
            timestamp=now_utc
        )
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(incident)

        # Publish SSE notification
        get_broadcaster().publish_nowait("INCIDENT_CREATED", {
            "incident_id": incident.incident_id,
            "title": incident.title,
            "severity": incident.severity,
            "agent_id": incident.agent_id
        })

        return incident

    def _correlate_critical_finding(
        self,
        agent: Agent,
        finding: SecurityFinding,
        now_utc: datetime
    ) -> Optional[SecurityIncident]:
        correlation_rule = "CRITICAL_FINDING_ESCALATION"
        finding_ids = [finding.id]
        dedup_key = self.generate_dedup_key(correlation_rule, agent.id, finding_ids)

        existing = self.db.query(SecurityIncident).filter(
            SecurityIncident.dedup_key == dedup_key
        ).first()
        if existing:
            return None

        try:
            ev_ids = json.loads(finding.evidence_event_ids) if finding.evidence_event_ids else []
        except Exception:
            ev_ids = []

        inc_uuid = hashlib.sha256(f"{dedup_key}:{now_utc.isoformat()}".encode()).hexdigest()[:8]
        incident_id_str = f"INC-{now_utc.strftime('%Y%m%d')}-CRIT-{inc_uuid}"
        db_id = f"inc_{inc_uuid}"

        incident = SecurityIncident(
            id=db_id,
            incident_id=incident_id_str,
            title=f"Critical Security Incident: {finding.title}",
            summary=f"Automated escalation of CRITICAL severity finding '{finding.title}' for agent '{agent.id}'.",
            severity="CRITICAL",
            status="OPEN",
            agent_id=agent.id,
            correlation_rule=correlation_rule,
            correlation_explanation=f"Critical finding '{finding.rule_id}' immediately escalated to incident status.",
            finding_ids=json.dumps(finding_ids),
            evidence_event_ids=json.dumps(ev_ids),
            dedup_key=dedup_key,
            created_at=now_utc,
            updated_at=now_utc,
            metadata_json=json.dumps({"rule_id": finding.rule_id, "finding_id": finding.id})
        )
        self.db.add(incident)

        audit_log = IncidentAuditLog(
            id=f"ilog_{int(now_utc.timestamp())}_{uuid.uuid4().hex[:8]}",
            incident_id=db_id,
            action="CREATED",
            previous_status=None,
            new_status="OPEN",
            performed_by="INCIDENT_CORRELATOR",
            notes=f"Escalated from critical finding {finding.rule_id}.",
            timestamp=now_utc
        )
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(incident)

        # Publish SSE notification
        get_broadcaster().publish_nowait("INCIDENT_CREATED", {
            "incident_id": incident.incident_id,
            "title": incident.title,
            "severity": incident.severity,
            "agent_id": incident.agent_id
        })

        return incident
