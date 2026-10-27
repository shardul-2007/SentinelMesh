"""
SentinelMesh Explainable Detection Testing Lab
Phase 6: Safe, Predefined Threat Scenario Simulation and Explainability Validation
"""

import json
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models import Agent, AuditEvent, ActionRequest, IntegrityRecord, TamperAlert, SecurityFinding, FindingAuditLog
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex
from app.threats.engine import ThreatDetectionEngine

LAB_AGENT_ID = "sim-lab-agent"

PREDEFINED_SCENARIOS = {
    "SCENARIO_NORMAL": {
        "scenario_id": "SCENARIO_NORMAL",
        "name": "Benign Operational Activity (Negative Control)",
        "description": "Simulates normal, compliant agent queries (e.g. reading public documentation and system health). Validates that benign activity does NOT trigger false positive security findings.",
        "expected_findings": 0,
        "expected_rule": None
    },
    "SCENARIO_REPEATED_BLOCKED": {
        "scenario_id": "SCENARIO_REPEATED_BLOCKED",
        "name": "Repeated Blocked Probing Attempts",
        "description": "Simulates an agent attempting 3 consecutive operations against forbidden database endpoints. Tests deterministic triggering of RULE-REP-BLK-01.",
        "expected_findings": 1,
        "expected_rule": "RULE-REP-BLK-01"
    },
    "SCENARIO_VELOCITY_BURST": {
        "scenario_id": "SCENARIO_VELOCITY_BURST",
        "name": "Action Velocity Spike / Runaway Loop",
        "description": "Simulates an agent submitting 9 rapid requests in under 10 seconds. Tests deterministic triggering of RULE-HIGH-FREQ-02.",
        "expected_findings": 1,
        "expected_rule": "RULE-HIGH-FREQ-02"
    },
    "SCENARIO_POLICY_VIOLATIONS": {
        "scenario_id": "SCENARIO_POLICY_VIOLATIONS",
        "name": "Multiple Policy Violations Across Endpoints",
        "description": "Simulates an agent attempting restricted actions across multiple protected resources violating different policies. Tests deterministic triggering of RULE-POL-VIOL-03.",
        "expected_findings": 1,
        "expected_rule": "RULE-POL-VIOL-03"
    },
    "SCENARIO_INTEGRITY_TAMPER": {
        "scenario_id": "SCENARIO_INTEGRITY_TAMPER",
        "name": "Isolated Cryptographic Tamper Alert",
        "description": "Simulates an audit evidence verification discrepancy where recorded data diverges from canonical SHA-256 hash. Tests deterministic triggering of RULE-INTEG-FAIL-06.",
        "expected_findings": 1,
        "expected_rule": "RULE-INTEG-FAIL-06"
    }
}


class ThreatSimulationLab:
    def __init__(self, db: Session):
        self.db = db

    def ensure_lab_agent(self) -> Agent:
        agent = self.db.query(Agent).filter(Agent.id == LAB_AGENT_ID).first()
        if not agent:
            agent = Agent(
                id=LAB_AGENT_ID,
                name="Security Lab Simulation Agent",
                role="SIMULATION_PROBE",
                permissions=json.dumps(["SIMULATE_TEST"]),
                status="ACTIVE",
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(agent)
            self.db.commit()
            self.db.refresh(agent)
        return agent

    def run_scenario(self, scenario_id: str) -> Dict[str, Any]:
        """
        Executes a predefined testing scenario in an isolated environment.
        """
        if scenario_id not in PREDEFINED_SCENARIOS:
            raise ValueError(f"Unknown scenario ID '{scenario_id}'. Available: {list(PREDEFINED_SCENARIOS.keys())}")

        scenario_meta = PREDEFINED_SCENARIOS[scenario_id]
        self.ensure_lab_agent()
        now = datetime.now(timezone.utc)

        # 1. Clean previous simulation data for this lab agent so scenarios run fresh
        self.reset_lab_data()

        evaluated_events = []

        if scenario_id == "SCENARIO_NORMAL":
            # Inject 4 benign ALLOW events
            for i in range(4):
                evt = self._create_sim_event(
                    event_id=f"sim_normal_{i}_{int(now.timestamp())}",
                    action_type="READ",
                    resource=f"/api/v1/documentation/topic_{i}",
                    decision="ALLOW",
                    policy_id="POL-DEFAULT-ALLOW",
                    reason="Benign documentation read query permitted",
                    timestamp=now - timedelta(seconds=30 - i * 5)
                )
                evaluated_events.append(evt)

        elif scenario_id == "SCENARIO_REPEATED_BLOCKED":
            # Inject 3 consecutive BLOCK events within 5 minutes
            for i in range(3):
                evt = self._create_sim_event(
                    event_id=f"sim_blk_{i}_{int(now.timestamp())}",
                    action_type="DELETE",
                    resource=f"/api/v1/internal/users/batch_{i}",
                    decision="BLOCK",
                    policy_id="POL-BLOCK-DESTRUCTIVE",
                    reason="Destructive delete blocked by security policy",
                    timestamp=now - timedelta(minutes=4 - i)
                )
                evaluated_events.append(evt)

        elif scenario_id == "SCENARIO_VELOCITY_BURST":
            # Inject 9 rapid events in the last 20 seconds
            for i in range(9):
                evt = self._create_sim_event(
                    event_id=f"sim_burst_{i}_{int(now.timestamp())}",
                    action_type="QUERY",
                    resource=f"/api/v1/telemetry/metric_{i}",
                    decision="ALLOW",
                    policy_id="POL-TELEMETRY-READ",
                    reason="Automated query execution",
                    timestamp=now - timedelta(seconds=20 - (i * 2))
                )
                evaluated_events.append(evt)

        elif scenario_id == "SCENARIO_POLICY_VIOLATIONS":
            # Inject 3 violations across different policies
            policies = [
                ("POL-PROD-GUARD", "UPDATE", "/api/v1/prod/settings"),
                ("POL-AUTH-GUARD", "EXPORT", "/api/v1/auth/tokens"),
                ("POL-INFRA-GUARD", "EXECUTE_COMMAND", "/sys/kernel/debug")
            ]
            for i, (pol, act, res) in enumerate(policies):
                evt = self._create_sim_event(
                    event_id=f"sim_viol_{i}_{int(now.timestamp())}",
                    action_type=act,
                    resource=res,
                    decision="BLOCK",
                    policy_id=pol,
                    reason=f"Restricted access to {res} blocked by {pol}",
                    timestamp=now - timedelta(minutes=10 - i * 2)
                )
                evaluated_events.append(evt)

        elif scenario_id == "SCENARIO_INTEGRITY_TAMPER":
            # Inject an event and an associated TamperAlert
            evt = self._create_sim_event(
                event_id=f"sim_tamper_{int(now.timestamp())}",
                action_type="PAYMENT_TRANSFER",
                resource="/api/v1/finance/treasury",
                decision="REQUIRE_APPROVAL",
                policy_id="POL-FIN-HIGH-RISK",
                reason="High value transfer requires verification",
                timestamp=now - timedelta(minutes=5)
            )
            evaluated_events.append(evt)

            # Create an active TamperAlert for this simulation event
            alert = TamperAlert(
                id=f"alt_sim_{int(now.timestamp())}",
                event_id=evt.id,
                detection_timestamp=now,
                severity="CRITICAL",
                status="OPEN",
                trusted_source="LOCAL_RECORD",
                expected_hash="0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
                calculated_hash="0x9999888877776666555544443333222211110000ffffeeeeddddccccbbbbaaaa",
                details=json.dumps({"reason": "Simulated hash divergence in disposable test record."})
            )
            self.db.add(alert)
            self.db.commit()

        # 2. Run detection engine for the lab agent
        engine = ThreatDetectionEngine(self.db)
        detection_result = engine.run_detection(
            agent_id=LAB_AGENT_ID,
            include_simulation=True,
            triggered_by="SIMULATION_LAB"
        )

        findings = self.db.query(SecurityFinding).filter(
            SecurityFinding.agent_id == LAB_AGENT_ID,
            SecurityFinding.is_simulation == True
        ).all()

        explanation = (
            f"Scenario '{scenario_meta['name']}' completed. "
            f"Injected {len(evaluated_events)} simulated action(s). "
            f"Resulted in {len(findings)} explainable finding(s) "
            f"(Expected: {scenario_meta['expected_findings']})."
        )

        return {
            "scenario_id": scenario_id,
            "scenario_name": scenario_meta["name"],
            "description": scenario_meta["description"],
            "actions_evaluated": len(evaluated_events),
            "findings_triggered": len(findings),
            "findings": findings,
            "explanation": explanation
        }

    def reset_lab_data(self) -> int:
        """
        Safely removes all simulation-tagged findings, alerts, and lab events
        without altering real application audit evidence.
        """
        # Delete simulation findings & audit logs
        sim_findings = self.db.query(SecurityFinding).filter(
            (SecurityFinding.agent_id == LAB_AGENT_ID) | (SecurityFinding.is_simulation == True)
        ).all()
        for f in sim_findings:
            self.db.delete(f)

        # Delete simulation tamper alerts
        sim_alerts = self.db.query(TamperAlert).filter(TamperAlert.id.like("alt_sim_%")).all()
        for a in sim_alerts:
            self.db.delete(a)

        # Delete simulation audit events & requests
        sim_events = self.db.query(AuditEvent).filter(
            (AuditEvent.agent_id == LAB_AGENT_ID) | (AuditEvent.id.like("sim_%"))
        ).all()
        for e in sim_events:
            # Delete associated integrity records
            self.db.query(IntegrityRecord).filter(IntegrityRecord.event_id == e.id).delete()
            self.db.delete(e)

        self.db.commit()
        return len(sim_findings)

    def _create_sim_event(
        self,
        event_id: str,
        action_type: str,
        resource: str,
        decision: str,
        policy_id: str,
        reason: str,
        timestamp: datetime
    ) -> AuditEvent:
        # Create ActionRequest
        req_id = f"req_{event_id}"
        req = ActionRequest(
            id=req_id,
            agent_id=LAB_AGENT_ID,
            action_type=action_type,
            resource=resource,
            derived_risk_level="HIGH" if decision == "BLOCK" else "LOW",
            reason=reason,
            created_at=timestamp
        )
        self.db.add(req)

        # Deterministic canonical hash
        raw_hash = compute_canonical_event_hash(
            event_id=event_id,
            timestamp=timestamp,
            agent_id=LAB_AGENT_ID,
            action_type=action_type,
            resource=resource,
            policy_decision=decision,
            policy_id=policy_id,
            policy_version="1.0.0",
            reason=reason,
            execution_mode="SIMULATED"
        )
        event_hash_hex = hash_to_bytes32_hex(raw_hash)

        # Create AuditEvent
        evt = AuditEvent(
            id=event_id,
            request_id=req_id,
            timestamp=timestamp,
            agent_id=LAB_AGENT_ID,
            action_type=action_type,
            resource=resource,
            policy_decision=decision,
            policy_id=policy_id,
            policy_version="1.0.0",
            reason=reason,
            execution_mode="SIMULATED",
            execution_status="BLOCKED" if decision == "BLOCK" else "EXECUTED_SIMULATED",
            approval_status="PENDING" if decision == "REQUIRE_APPROVAL" else "NONE",
            integrity_hash=raw_hash
        )
        self.db.add(evt)

        # Create IntegrityRecord
        irec = IntegrityRecord(
            id=f"int_{event_id}",
            event_id=event_id,
            hash_algorithm="SHA-256",
            canonical_version="1.0.0",
            event_hash=event_hash_hex,
            anchoring_status="NOT_ANCHORED",
            verification_status="INTACT",
            last_verified_at=timestamp
        )
        self.db.add(irec)
        self.db.commit()
        self.db.refresh(evt)
        return evt
