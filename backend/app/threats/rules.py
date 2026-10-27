"""
SentinelMesh Threat Detection Rules Registry
Phase 6: Deterministic, Explainable Behavioral Pattern Detectors
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class ThreatRule:
    rule_id: str
    name: str
    version: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    window_minutes: int
    threshold: int
    recommended_action: str
    is_enabled: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "version": self.version,
            "severity": self.severity,
            "description": self.description,
            "window_minutes": self.window_minutes,
            "threshold": self.threshold,
            "recommended_action": self.recommended_action,
            "is_enabled": self.is_enabled
        }


# Register of 6 deterministic behavioral rules
RULES_REGISTRY: Dict[str, ThreatRule] = {
    "RULE-REP-BLK-01": ThreatRule(
        rule_id="RULE-REP-BLK-01",
        name="Repeated Blocked Actions",
        version="1.0.0",
        severity="HIGH",
        description="Detects an agent repeatedly attempting actions that result in policy BLOCK decisions within a short timeframe, indicating possible unauthorized capability probing.",
        window_minutes=15,
        threshold=3,
        recommended_action="Quarantine agent capability or review agent system prompt for unauthorized capability requests."
    ),
    "RULE-HIGH-FREQ-02": ThreatRule(
        rule_id="RULE-HIGH-FREQ-02",
        name="Action Velocity Burst",
        version="1.0.0",
        severity="MEDIUM",
        description="Detects an unusually high frequency of agent operations within a 1-minute window, exceeding normal automated task pacing.",
        window_minutes=1,
        threshold=8,
        recommended_action="Inspect agent execution loop to ensure rate limiting and verify whether an automated loop has entered a runaway state."
    ),
    "RULE-POL-VIOL-03": ThreatRule(
        rule_id="RULE-POL-VIOL-03",
        name="Repeated Policy Violations",
        version="1.0.0",
        severity="HIGH",
        description="Detects multiple security policy violations across one or more protected resources within a 30-minute evaluation window.",
        window_minutes=30,
        threshold=3,
        recommended_action="Review policy bindings for this agent and audit recent model output tokens for prompt injection or jailbreak patterns."
    ),
    "RULE-REP-APPR-04": ThreatRule(
        rule_id="RULE-REP-APPR-04",
        name="Frequent High-Risk Approval Spikes",
        version="1.0.0",
        severity="MEDIUM",
        description="Detects an agent generating frequent operations requiring administrative human approval, which may lead to approval fatigue or indicate privilege escalation attempts.",
        window_minutes=60,
        threshold=3,
        recommended_action="Evaluate whether the agent's tasks require legitimate operational elevation or if requests should be batched."
    ),
    "RULE-SENS-ACT-05": ThreatRule(
        rule_id="RULE-SENS-ACT-05",
        name="Sensitive Operational Scope Access",
        version="1.0.0",
        severity="CRITICAL",
        description="Detects attempted operations targeting critical infrastructure, sensitive credential stores, or destructive system tables.",
        window_minutes=15,
        threshold=1,
        recommended_action="Immediate operator review: Verify agent role scope, examine the originating prompt, and ensure credentials remain isolated."
    ),
    "RULE-INTEG-FAIL-06": ThreatRule(
        rule_id="RULE-INTEG-FAIL-06",
        name="Cryptographic Audit Tamper Evidence",
        version="1.0.0",
        severity="CRITICAL",
        description="Detects cryptographic verification discrepancies where recorded audit events diverge from their canonical SHA-256 hash or blockchain anchor.",
        window_minutes=1440,  # 24 hours
        threshold=1,
        recommended_action="Trigger forensic audit immediately: Inspect host storage logs, database access credentials, and EVM contract anchor state."
    ),
}

def get_registered_rules() -> List[ThreatRule]:
    return list(RULES_REGISTRY.values())

def get_rule_by_id(rule_id: str) -> Optional[ThreatRule]:
    return RULES_REGISTRY.get(rule_id)
