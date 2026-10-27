"""
SentinelMesh Threat Detection Engine
Phase 6: Deterministic Behavioral Pattern Evaluation and Deduplication
"""

import json
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import AuditEvent, IntegrityRecord, TamperAlert, SecurityFinding, FindingAuditLog, DetectionRun, Agent
from app.threats.rules import RULES_REGISTRY, ThreatRule, get_registered_rules, get_rule_by_id


class ThreatDetectionEngine:
    """
    Modular, deterministic behavioral threat detection engine.
    Scans audit event history, evaluates configured rules, applies idempotent deduplication,
    and produces fully explainable security findings linked to concrete evidence events.
    """

    def __init__(self, db: Session):
        self.db = db

    def generate_dedup_key(self, rule_id: str, agent_id: str, evidence_ids: List[str]) -> str:
        """
        Generates a stable, reproducible deduplication key based on the rule,
        agent, and sorted evidence event IDs.
        """
        sorted_ids = sorted(evidence_ids)
        raw_key = f"{rule_id}:{agent_id}:{','.join(sorted_ids)}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:32]

    def run_detection(
        self,
        agent_id: Optional[str] = None,
        include_simulation: bool = False,
        triggered_by: str = "MANUAL"
    ) -> Dict[str, Any]:
        """
        Executes all active threat detection rules against recent audit history.
        Can target a single agent or scan all known agents.
        """
        run_start = datetime.now(timezone.utc)
        run_id = f"drun_{int(run_start.timestamp())}_{hashlib.sha256(str(run_start).encode()).hexdigest()[:6]}"
        
        # 1. Determine agents to scan
        if agent_id:
            agents = self.db.query(Agent).filter(Agent.id == agent_id).all()
        else:
            agents = self.db.query(Agent).all()

        total_scanned_events = 0
        new_findings: List[SecurityFinding] = []

        for agent in agents:
            findings_for_agent = self._evaluate_agent_rules(agent.id, include_simulation=include_simulation)
            new_findings.extend(findings_for_agent)

        # 2. Record DetectionRun audit entry
        detection_run = DetectionRun(
            id=run_id,
            run_timestamp=run_start,
            triggered_by=triggered_by,
            agent_id=agent_id,
            events_scanned=total_scanned_events,
            findings_generated=len(new_findings),
            status="SUCCESS",
            details=json.dumps({
                "agent_id_filter": agent_id,
                "agents_evaluated": len(agents),
                "new_findings_count": len(new_findings),
                "duration_ms": int((datetime.now(timezone.utc) - run_start).total_seconds() * 1000)
            })
        )
        self.db.add(detection_run)
        self.db.commit()

        return {
            "run_id": run_id,
            "run_timestamp": run_start,
            "triggered_by": triggered_by,
            "agents_evaluated": len(agents),
            "findings_generated": len(new_findings),
            "findings": new_findings
        }

    def _evaluate_agent_rules(self, agent_id: str, include_simulation: bool = False) -> List[SecurityFinding]:
        """
        Evaluates all registered rules for an individual agent.
        """
        created_findings: List[SecurityFinding] = []
        now = datetime.now(timezone.utc)

        # Rule 1: RULE-REP-BLK-01 (Repeated Blocked Actions in 15 mins)
        fnd1 = self._check_repeated_blocked(agent_id, now, include_simulation)
        if fnd1:
            created_findings.append(fnd1)

        # Rule 2: RULE-HIGH-FREQ-02 (Velocity Burst in 1 min)
        fnd2 = self._check_velocity_burst(agent_id, now, include_simulation)
        if fnd2:
            created_findings.append(fnd2)

        # Rule 3: RULE-POL-VIOL-03 (Repeated Policy Violations in 30 mins)
        fnd3 = self._check_policy_violations(agent_id, now, include_simulation)
        if fnd3:
            created_findings.append(fnd3)

        # Rule 4: RULE-REP-APPR-04 (Approval Request Spikes in 60 mins)
        fnd4 = self._check_approval_spikes(agent_id, now, include_simulation)
        if fnd4:
            created_findings.append(fnd4)

        # Rule 5: RULE-SENS-ACT-05 (Sensitive Operational Scope Access in 15 mins)
        fnd5 = self._check_sensitive_access(agent_id, now, include_simulation)
        if fnd5:
            created_findings.append(fnd5)

        # Rule 6: RULE-INTEG-FAIL-06 (Cryptographic Audit Tamper Evidence)
        fnd6 = self._check_integrity_tamper(agent_id, now, include_simulation)
        if fnd6:
            created_findings.append(fnd6)

        return created_findings

    def _check_repeated_blocked(self, agent_id: str, now: datetime, include_simulation: bool) -> Optional[SecurityFinding]:
        rule = RULES_REGISTRY["RULE-REP-BLK-01"]
        cutoff = now - timedelta(minutes=rule.window_minutes)

        events = self.db.query(AuditEvent).filter(
            AuditEvent.agent_id == agent_id,
            AuditEvent.timestamp >= cutoff,
            AuditEvent.policy_decision == "BLOCK"
        ).order_by(desc(AuditEvent.timestamp)).all()

        if len(events) >= rule.threshold:
            evidence_ids = [e.id for e in events[:rule.threshold]]
            return self._create_or_get_finding(
                rule=rule,
                agent_id=agent_id,
                evidence_ids=evidence_ids,
                title=f"Repeated Blocked Operations ({len(evidence_ids)} attempts)",
                description=(
                    f"Agent '{agent_id}' triggered {len(evidence_ids)} consecutive policy BLOCK decisions "
                    f"within {rule.window_minutes} minutes. Target resources included: "
                    f"{', '.join(set([e.resource for e in events[:rule.threshold]]))[:120]}."
                ),
                metadata={
                    "window_minutes": rule.window_minutes,
                    "threshold": rule.threshold,
                    "blocked_count": len(evidence_ids),
                    "resources": [e.resource for e in events[:rule.threshold]]
                },
                is_simulation=include_simulation
            )
        return None

    def _check_velocity_burst(self, agent_id: str, now: datetime, include_simulation: bool) -> Optional[SecurityFinding]:
        rule = RULES_REGISTRY["RULE-HIGH-FREQ-02"]
        cutoff = now - timedelta(minutes=rule.window_minutes)

        events = self.db.query(AuditEvent).filter(
            AuditEvent.agent_id == agent_id,
            AuditEvent.timestamp >= cutoff
        ).order_by(desc(AuditEvent.timestamp)).all()

        if len(events) >= rule.threshold:
            evidence_ids = [e.id for e in events[:rule.threshold]]
            return self._create_or_get_finding(
                rule=rule,
                agent_id=agent_id,
                evidence_ids=evidence_ids,
                title=f"Action Velocity Burst ({len(events)} operations / minute)",
                description=(
                    f"Agent '{agent_id}' executed {len(events)} operations in under 1 minute, "
                    f"exceeding the standard burst threshold of {rule.threshold} ops/min."
                ),
                metadata={
                    "window_minutes": rule.window_minutes,
                    "threshold": rule.threshold,
                    "observed_velocity": len(events)
                },
                is_simulation=include_simulation
            )
        return None

    def _check_policy_violations(self, agent_id: str, now: datetime, include_simulation: bool) -> Optional[SecurityFinding]:
        rule = RULES_REGISTRY["RULE-POL-VIOL-03"]
        cutoff = now - timedelta(minutes=rule.window_minutes)

        events = self.db.query(AuditEvent).filter(
            AuditEvent.agent_id == agent_id,
            AuditEvent.timestamp >= cutoff,
            AuditEvent.policy_decision == "BLOCK"
        ).order_by(desc(AuditEvent.timestamp)).all()

        unique_policies = list(set([e.policy_id for e in events]))
        if len(events) >= rule.threshold and len(unique_policies) >= 2:
            evidence_ids = [e.id for e in events[:rule.threshold]]
            return self._create_or_get_finding(
                rule=rule,
                agent_id=agent_id,
                evidence_ids=evidence_ids,
                title=f"Multi-Policy Violations Across Controls ({len(unique_policies)} policies)",
                description=(
                    f"Agent '{agent_id}' violated security controls across "
                    f"{len(unique_policies)} distinct policies ({', '.join(unique_policies)}) in the last {rule.window_minutes} minutes."
                ),
                metadata={
                    "window_minutes": rule.window_minutes,
                    "threshold": rule.threshold,
                    "violation_count": len(events),
                    "policies_violated": unique_policies
                },
                is_simulation=include_simulation
            )
        return None

    def _check_approval_spikes(self, agent_id: str, now: datetime, include_simulation: bool) -> Optional[SecurityFinding]:
        rule = RULES_REGISTRY["RULE-REP-APPR-04"]
        cutoff = now - timedelta(minutes=rule.window_minutes)

        events = self.db.query(AuditEvent).filter(
            AuditEvent.agent_id == agent_id,
            AuditEvent.timestamp >= cutoff,
            AuditEvent.policy_decision == "REQUIRE_APPROVAL"
        ).order_by(desc(AuditEvent.timestamp)).all()

        if len(events) >= rule.threshold:
            evidence_ids = [e.id for e in events[:rule.threshold]]
            return self._create_or_get_finding(
                rule=rule,
                agent_id=agent_id,
                evidence_ids=evidence_ids,
                title=f"Frequent High-Risk Approval Requests ({len(evidence_ids)} requests)",
                description=(
                    f"Agent '{agent_id}' generated {len(evidence_ids)} actions requiring administrative human approval "
                    f"within {rule.window_minutes} minutes."
                ),
                metadata={
                    "window_minutes": rule.window_minutes,
                    "threshold": rule.threshold,
                    "approval_requests_count": len(evidence_ids)
                },
                is_simulation=include_simulation
            )
        return None

    def _check_sensitive_access(self, agent_id: str, now: datetime, include_simulation: bool) -> Optional[SecurityFinding]:
        rule = RULES_REGISTRY["RULE-SENS-ACT-05"]
        cutoff = now - timedelta(minutes=rule.window_minutes)

        sensitive_keywords = ["/etc/", "production", "credential", "vault", "auth-keys", "prod-db", "root", "secret"]
        sensitive_actions = ["DEPLOY_CONTRACT", "DROP_DATABASE", "EXECUTE_COMMAND", "PROVISION_ADMIN"]

        events = self.db.query(AuditEvent).filter(
            AuditEvent.agent_id == agent_id,
            AuditEvent.timestamp >= cutoff
        ).order_by(desc(AuditEvent.timestamp)).all()

        matched_events = []
        for e in events:
            is_sensitive_res = any(k in e.resource.lower() for k in sensitive_keywords)
            is_sensitive_act = e.action_type.upper() in sensitive_actions
            if is_sensitive_res or is_sensitive_act:
                matched_events.append(e)

        if len(matched_events) >= rule.threshold:
            evidence_ids = [e.id for e in matched_events[:rule.threshold]]
            sample_evt = matched_events[0]
            return self._create_or_get_finding(
                rule=rule,
                agent_id=agent_id,
                evidence_ids=evidence_ids,
                title=f"Critical Operational Scope Access Attempt: {sample_evt.action_type}",
                description=(
                    f"Agent '{agent_id}' attempted high-sensitivity action '{sample_evt.action_type}' "
                    f"targeting protected resource '{sample_evt.resource}'. Decision was: {sample_evt.policy_decision}."
                ),
                metadata={
                    "window_minutes": rule.window_minutes,
                    "threshold": rule.threshold,
                    "target_action": sample_evt.action_type,
                    "target_resource": sample_evt.resource,
                    "decision": sample_evt.policy_decision
                },
                is_simulation=include_simulation
            )
        return None

    def _check_integrity_tamper(self, agent_id: str, now: datetime, include_simulation: bool) -> Optional[SecurityFinding]:
        rule = RULES_REGISTRY["RULE-INTEG-FAIL-06"]
        cutoff = now - timedelta(minutes=rule.window_minutes)

        # Look for open TamperAlerts associated with this agent's events
        alerts = self.db.query(TamperAlert).join(AuditEvent, TamperAlert.event_id == AuditEvent.id).filter(
            AuditEvent.agent_id == agent_id,
            TamperAlert.detection_timestamp >= cutoff,
            TamperAlert.status.in_(["OPEN", "INVESTIGATING"])
        ).order_by(desc(TamperAlert.detection_timestamp)).all()

        if len(alerts) >= rule.threshold:
            evidence_ids = [a.event_id for a in alerts[:rule.threshold]]
            sample_alert = alerts[0]
            return self._create_or_get_finding(
                rule=rule,
                agent_id=agent_id,
                evidence_ids=evidence_ids,
                title="Cryptographic Audit Tamper Evidence Detected",
                description=(
                    f"Cryptographic integrity verifier discovered hash discrepancy for event '{sample_alert.event_id}'. "
                    f"Calculated canonical hash differed from expected hash ({sample_alert.trusted_source})."
                ),
                metadata={
                    "window_minutes": rule.window_minutes,
                    "threshold": rule.threshold,
                    "alert_id": sample_alert.id,
                    "trusted_source": sample_alert.trusted_source,
                    "expected_hash": sample_alert.expected_hash,
                    "calculated_hash": sample_alert.calculated_hash
                },
                is_simulation=include_simulation
            )
        return None

    def _create_or_get_finding(
        self,
        rule: ThreatRule,
        agent_id: str,
        evidence_ids: List[str],
        title: str,
        description: str,
        metadata: Dict[str, Any],
        is_simulation: bool = False
    ) -> Optional[SecurityFinding]:
        """
        Idempotent finding creation with stable deduplication.
        If a finding with this dedup key already exists, returns None (no spam).
        """
        dedup_key = self.generate_dedup_key(rule.rule_id, agent_id, evidence_ids)

        existing = self.db.query(SecurityFinding).filter(
            SecurityFinding.dedup_key == dedup_key
        ).first()

        if existing:
            # Already flagged and recorded - do not duplicate
            return None

        # Create new finding
        now_utc = datetime.now(timezone.utc)
        clean_date_str = now_utc.strftime("%Y%m%d")
        fnd_uuid = hashlib.sha256(f"{dedup_key}:{now_utc.isoformat()}".encode()).hexdigest()[:8]
        finding_id_str = f"FIND-{clean_date_str}-{rule.rule_id.split('-')[1]}-{fnd_uuid}"
        db_id = f"fnd_{fnd_uuid}"

        new_finding = SecurityFinding(
            id=db_id,
            finding_id=finding_id_str,
            rule_id=rule.rule_id,
            rule_version=rule.version,
            agent_id=agent_id,
            severity=rule.severity,
            status="ACTIVE",
            title=title,
            description=description,
            recommended_action=rule.recommended_action,
            evidence_event_ids=json.dumps(evidence_ids),
            dedup_key=dedup_key,
            detected_at=now_utc,
            is_simulation=is_simulation,
            finding_metadata=json.dumps(metadata)
        )
        self.db.add(new_finding)

        # Add initial audit log entry
        audit_log = FindingAuditLog(
            id=f"flog_{fnd_uuid}",
            finding_id=db_id,
            action="CREATED",
            previous_status=None,
            new_status="ACTIVE",
            performed_by="SYSTEM_DETECTOR",
            notes=f"Automated behavioral detection triggered by rule {rule.rule_id}@{rule.version}.",
            timestamp=now_utc
        )
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(new_finding)

        return new_finding
