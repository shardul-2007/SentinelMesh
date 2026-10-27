"""
SentinelMesh Agent Risk Scorer
Phase 6: Deterministic, Explainable Heuristic Risk Index
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import AuditEvent, IntegrityRecord, TamperAlert, SecurityFinding, Agent, SecurityPolicy


FORMULA_DISCLAIMER = (
    "Deterministic heuristic risk index (0-100) calculated from observed audit trails and policy decisions. "
    "This is NOT a machine-learning model or probabilistic prediction of malicious intent. "
    "Risk scores provide operator visibility and do not automatically alter policy enforcement."
)

MIN_SAMPLE_SIZE = 3
DEFAULT_OBSERVATION_WINDOW_HOURS = 24


def calculate_agent_risk_score(
    db: Session,
    agent_id: str,
    window_hours: int = DEFAULT_OBSERVATION_WINDOW_HOURS
) -> Dict[str, Any]:
    """
    Computes a deterministic, explainable risk score (0-100) for a given agent.
    If fewer than MIN_SAMPLE_SIZE events exist, returns INSUFFICIENT_DATA tier.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=window_hours)

    # 1. Query events in the observation window
    events = db.query(AuditEvent).filter(
        AuditEvent.agent_id == agent_id,
        AuditEvent.timestamp >= cutoff_time
    ).all()

    total_actions = len(events)

    if total_actions < MIN_SAMPLE_SIZE:
        return {
            "risk_score": 0,
            "risk_tier": "INSUFFICIENT_DATA",
            "observation_window_hours": window_hours,
            "sample_size": total_actions,
            "insufficient_data": True,
            "factors": [
                {
                    "factor_name": "Sample Size",
                    "raw_metric": f"{total_actions} / {MIN_SAMPLE_SIZE} minimum events",
                    "points_contributed": 0,
                    "max_points": 0,
                    "description": f"Observation window contains {total_actions} action(s). Minimum {MIN_SAMPLE_SIZE} required to establish baseline risk."
                }
            ],
            "formula_disclaimer": FORMULA_DISCLAIMER
        }

    # 2. Extract metrics
    blocked_actions = sum(1 for e in events if e.policy_decision == "BLOCK")
    approval_required_actions = sum(1 for e in events if e.policy_decision == "REQUIRE_APPROVAL")
    allowed_actions = sum(1 for e in events if e.policy_decision == "ALLOW")
    blocked_ratio = blocked_actions / total_actions if total_actions > 0 else 0.0

    # Policy violations (BLOCK decisions)
    violations_count = blocked_actions

    # Integrity verification failures / tamper alerts in window
    event_ids = [e.id for e in events]
    integrity_failures = db.query(TamperAlert).filter(
        TamperAlert.event_id.in_(event_ids) if event_ids else False
    ).count()

    # Active security findings for this agent
    active_findings = db.query(SecurityFinding).filter(
        SecurityFinding.agent_id == agent_id,
        SecurityFinding.status.in_(["ACTIVE", "INVESTIGATING"])
    ).count()

    # 3. Deterministic point weighting formula
    # Factor A: Blocked Action Ratio (up to 35 pts)
    ratio_points = int(round(blocked_ratio * 35))

    # Factor B: Raw Policy Violations (up to 25 pts)
    violation_points = min(violations_count, 5) * 5

    # Factor C: Frequent Approval Requests (up to 15 pts)
    approval_points = min(approval_required_actions, 5) * 3

    # Factor D: Cryptographic Integrity Discrepancies (up to 40 pts)
    tamper_points = min(integrity_failures, 2) * 20

    # Factor E: Active Unresolved Security Findings (up to 20 pts)
    finding_points = min(active_findings, 4) * 5

    raw_total = ratio_points + violation_points + approval_points + tamper_points + finding_points
    risk_score = min(100, max(0, raw_total))

    # Determine Tier
    if risk_score >= 76:
        risk_tier = "CRITICAL"
    elif risk_score >= 51:
        risk_tier = "ELEVATED"
    elif risk_score >= 26:
        risk_tier = "MODERATE"
    else:
        risk_tier = "LOW"

    factors = [
        {
            "factor_name": "Blocked Action Ratio",
            "raw_metric": f"{round(blocked_ratio * 100, 1)}% ({blocked_actions}/{total_actions})",
            "points_contributed": ratio_points,
            "max_points": 35,
            "description": "Proportion of evaluated actions that violated policy and were blocked."
        },
        {
            "factor_name": "Policy Violations",
            "raw_metric": f"{violations_count} violation(s)",
            "points_contributed": violation_points,
            "max_points": 25,
            "description": "Count of policy-violating operations attempted in the observation window."
        },
        {
            "factor_name": "Approval-Required Actions",
            "raw_metric": f"{approval_required_actions} action(s)",
            "points_contributed": approval_points,
            "max_points": 15,
            "description": "Operations requiring elevated human-in-the-loop authorization."
        },
        {
            "factor_name": "Cryptographic Integrity Discrepancies",
            "raw_metric": f"{integrity_failures} alert(s)",
            "points_contributed": tamper_points,
            "max_points": 40,
            "description": "Evidence records failing local SHA-256 verification or blockchain anchor check."
        },
        {
            "factor_name": "Active Security Findings",
            "raw_metric": f"{active_findings} active finding(s)",
            "points_contributed": finding_points,
            "max_points": 20,
            "description": "Unresolved behavioral pattern findings flagged by detection rules."
        }
    ]

    return {
        "risk_score": risk_score,
        "risk_tier": risk_tier,
        "observation_window_hours": window_hours,
        "sample_size": total_actions,
        "insufficient_data": False,
        "factors": factors,
        "formula_disclaimer": FORMULA_DISCLAIMER
    }
