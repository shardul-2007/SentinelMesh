import fnmatch
import hashlib
import json
from typing import Dict, Any, Optional, Tuple, List
from app.schemas import (
    PolicyDecisionEnum,
    ExecutionStatusEnum,
    RiskTierEnum
)

class EvaluationResult:
    def __init__(
        self,
        decision: PolicyDecisionEnum,
        policy_id: str,
        policy_name: str,
        policy_version: str,
        reason: str,
        derived_risk_level: RiskTierEnum,
        execution_status: ExecutionStatusEnum,
        approval_status: str,
        execution_mode: str = "SIMULATED"
    ):
        self.decision = decision
        self.policy_id = policy_id
        self.policy_name = policy_name
        self.policy_version = policy_version
        self.reason = reason
        self.derived_risk_level = derived_risk_level
        self.execution_status = execution_status
        self.approval_status = approval_status
        self.execution_mode = execution_mode


class PolicyEvaluator:
    """
    Deterministic zero-trust policy evaluation engine for AI Agent operations.
    Enforces policies POL-A through POL-G.
    Client-supplied risk levels are ignored; risk is derived server-side.
    """

    KNOWN_ACTIONS = {"READ", "UPDATE", "DELETE", "EXPORT", "ADMIN_EXEC", "WRITE", "EXEC", "SHELL"}

    @classmethod
    def derive_risk_tier(cls, action_type: str, resource: str) -> RiskTierEnum:
        norm_action = action_type.strip().upper()
        norm_res = resource.strip().lower()

        if norm_action in {"ADMIN_EXEC", "EXEC", "SHELL"} or "cmd" in norm_res or "shell" in norm_res:
            return RiskTierEnum.CRITICAL
        if norm_action in {"DELETE", "EXPORT"} or "restricted" in norm_res or "secret" in norm_res:
            return RiskTierEnum.HIGH
        if norm_action in {"UPDATE", "WRITE"}:
            return RiskTierEnum.MEDIUM
        if norm_action == "READ":
            if norm_res.startswith("public/"):
                return RiskTierEnum.LOW
            if norm_res.startswith("restricted/"):
                return RiskTierEnum.HIGH
            return RiskTierEnum.MEDIUM
        return RiskTierEnum.HIGH

    @classmethod
    def evaluate(
        cls,
        agent_id: str,
        action_type: str,
        resource: str,
        agent_permissions: Optional[List[str]] = None
    ) -> EvaluationResult:
        perms = set(agent_permissions or [])
        action = action_type.strip().upper()
        res = resource.strip()
        derived_risk = cls.derive_risk_tier(action, res)

        # 1. Validation: Malformed or empty action/resource -> POL-G (Default Deny)
        if not action or not res:
            return EvaluationResult(
                decision=PolicyDecisionEnum.BLOCK,
                policy_id="POL-G",
                policy_name="Default Deny Policy",
                policy_version="1.0.0",
                reason="Denied: Action or resource identifier is empty or malformed.",
                derived_risk_level=RiskTierEnum.HIGH,
                execution_status=ExecutionStatusEnum.BLOCKED,
                approval_status="NONE"
            )

        # 2. Administrative command execution barrier (POL-F)
        if action in {"ADMIN_EXEC", "EXEC", "SHELL"} or any(res.startswith(prefix) for prefix in ["sys://", "os://", "/bin/", "sh://"]):
            return EvaluationResult(
                decision=PolicyDecisionEnum.BLOCK,
                policy_id="POL-F",
                policy_name="Administrative Command Sandbox Barrier",
                policy_version="1.0.0",
                reason="Blocked by POL-F: Arbitrary administrative commands and OS executions are strictly disallowed in sandbox simulator.",
                derived_risk_level=RiskTierEnum.CRITICAL,
                execution_status=ExecutionStatusEnum.BLOCKED,
                approval_status="NONE"
            )

        # 3. Restricted resource protection (POL-B)
        if res.startswith("restricted/") or res.startswith("secret/") or "/creds" in res:
            if "sec:restricted_access" not in perms:
                return EvaluationResult(
                    decision=PolicyDecisionEnum.BLOCK,
                    policy_id="POL-B",
                    policy_name="Restricted Resource Shield",
                    policy_version="1.0.0",
                    reason=f"Blocked by POL-B: Agent '{agent_id}' lacks mandatory permission 'sec:restricted_access' for restricted resource '{res}'.",
                    derived_risk_level=RiskTierEnum.HIGH,
                    execution_status=ExecutionStatusEnum.BLOCKED,
                    approval_status="NONE"
                )

        # 4. Public resource read access (POL-A)
        if action == "READ" and (res.startswith("public/") or fnmatch.fnmatch(res, "public/*")):
            return EvaluationResult(
                decision=PolicyDecisionEnum.ALLOW,
                policy_id="POL-A",
                policy_name="Public Resource Read Access",
                policy_version="1.0.0",
                reason=f"Allowed by POL-A: Resource '{res}' is verified public and action is read-only.",
                derived_risk_level=RiskTierEnum.LOW,
                execution_status=ExecutionStatusEnum.EXECUTED_SIMULATED,
                approval_status="NONE"
            )

        # 5. Database deletion protection (POL-D)
        if action == "DELETE" and (res.startswith("db://") or "database" in res.lower() or "table" in res.lower()):
            return EvaluationResult(
                decision=PolicyDecisionEnum.REQUIRE_APPROVAL,
                policy_id="POL-D",
                policy_name="Database Deletion Protection",
                policy_version="1.0.0",
                reason=f"Approval Required by POL-D: Destructive database deletion on '{res}' requires explicit administrative authorization.",
                derived_risk_level=RiskTierEnum.HIGH,
                execution_status=ExecutionStatusEnum.PENDING_APPROVAL,
                approval_status="PENDING"
            )

        # 6. Customer data export gate (POL-E)
        if action == "EXPORT" or (action in {"EXPORT", "DUMP", "EXTRACT"} and any(res.startswith(prefix) for prefix in ["db://users", "db://customers", "export://"])):
            return EvaluationResult(
                decision=PolicyDecisionEnum.REQUIRE_APPROVAL,
                policy_id="POL-E",
                policy_name="Customer Data Export Gate",
                policy_version="1.0.0",
                reason=f"Approval Required by POL-E: Bulk export of sensitive customer/user records on '{res}' requires human sign-off.",
                derived_risk_level=RiskTierEnum.HIGH,
                execution_status=ExecutionStatusEnum.PENDING_APPROVAL,
                approval_status="PENDING"
            )

        # 7. Database record update control (POL-C)
        if action in {"UPDATE", "WRITE"} and res.startswith("db://"):
            # Check if agent has db:write permission
            if "db:write" in perms or "admin" in perms:
                return EvaluationResult(
                    decision=PolicyDecisionEnum.ALLOW,
                    policy_id="POL-C",
                    policy_name="Database Record Update Control",
                    policy_version="1.0.0",
                    reason=f"Allowed by POL-C: Database update permitted under validated 'db:write' grant.",
                    derived_risk_level=RiskTierEnum.MEDIUM,
                    execution_status=ExecutionStatusEnum.EXECUTED_SIMULATED,
                    approval_status="NONE"
                )
            else:
                return EvaluationResult(
                    decision=PolicyDecisionEnum.BLOCK,
                    policy_id="POL-C",
                    policy_name="Database Record Update Control",
                    policy_version="1.0.0",
                    reason=f"Blocked by POL-C: Agent '{agent_id}' missing required permission 'db:write' to modify '{res}'.",
                    derived_risk_level=RiskTierEnum.MEDIUM,
                    execution_status=ExecutionStatusEnum.BLOCKED,
                    approval_status="NONE"
                )

        # 8. Unmatched or unknown actions -> POL-G (Default Deny)
        return EvaluationResult(
            decision=PolicyDecisionEnum.BLOCK,
            policy_id="POL-G",
            policy_name="Default Deny Policy",
            policy_version="1.0.0",
            reason=f"Blocked by POL-G (Default Deny): Action '{action}' on resource '{res}' does not match any permissive policy.",
            derived_risk_level=RiskTierEnum.HIGH,
            execution_status=ExecutionStatusEnum.BLOCKED,
            approval_status="NONE"
        )

    @classmethod
    def compute_integrity_hash(
        cls,
        event_id: str,
        timestamp_iso: str,
        agent_id: str,
        action_type: str,
        resource: str,
        decision: str,
        policy_id: str,
        previous_event_hash: Optional[str]
    ) -> str:
        payload = f"{event_id}|{timestamp_iso}|{agent_id}|{action_type}|{resource}|{decision}|{policy_id}|{previous_event_hash or 'GENESIS'}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
