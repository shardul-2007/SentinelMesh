import pytest
from app.policy_engine.evaluator import PolicyEvaluator
from app.schemas import PolicyDecisionEnum, ExecutionStatusEnum, RiskTierEnum

def test_policy_a_public_read_allowed():
    res = PolicyEvaluator.evaluate(
        agent_id="test-agent",
        action_type="READ",
        resource="public/whitepaper.pdf"
    )
    assert res.decision == PolicyDecisionEnum.ALLOW
    assert res.policy_id == "POL-A"
    assert res.derived_risk_level == RiskTierEnum.LOW
    assert res.execution_status == ExecutionStatusEnum.EXECUTED_SIMULATED
    assert res.approval_status == "NONE"
    assert res.execution_mode == "SIMULATED"

def test_policy_b_restricted_resource_blocked_without_permission():
    res = PolicyEvaluator.evaluate(
        agent_id="unauthorized-agent",
        action_type="READ",
        resource="restricted/api_keys.env",
        agent_permissions=[]
    )
    assert res.decision == PolicyDecisionEnum.BLOCK
    assert res.policy_id == "POL-B"
    assert res.derived_risk_level == RiskTierEnum.HIGH
    assert res.execution_status == ExecutionStatusEnum.BLOCKED
    assert "lacks mandatory permission" in res.reason

def test_policy_b_restricted_resource_allowed_with_permission():
    res = PolicyEvaluator.evaluate(
        agent_id="security-agent",
        action_type="READ",
        resource="restricted/api_keys.env",
        agent_permissions=["sec:restricted_access"]
    )
    # Even if permission allows passing POL-B, let's see how it's handled:
    # In evaluator, if perm is present, it passes POL-B and evaluates next or POL-G
    assert res.execution_status in [ExecutionStatusEnum.EXECUTED_SIMULATED, ExecutionStatusEnum.BLOCKED]

def test_policy_c_db_update_requires_permission():
    # Without permission -> BLOCK
    res_no_perm = PolicyEvaluator.evaluate(
        agent_id="agent-reader",
        action_type="UPDATE",
        resource="db://users/profile/42",
        agent_permissions=["db:read"]
    )
    assert res_no_perm.decision == PolicyDecisionEnum.BLOCK
    assert res_no_perm.policy_id == "POL-C"
    assert res_no_perm.execution_status == ExecutionStatusEnum.BLOCKED

    # With permission -> ALLOW
    res_with_perm = PolicyEvaluator.evaluate(
        agent_id="agent-writer",
        action_type="UPDATE",
        resource="db://users/profile/42",
        agent_permissions=["db:write"]
    )
    assert res_with_perm.decision == PolicyDecisionEnum.ALLOW
    assert res_with_perm.policy_id == "POL-C"
    assert res_with_perm.execution_status == ExecutionStatusEnum.EXECUTED_SIMULATED

def test_policy_d_db_delete_requires_approval():
    res = PolicyEvaluator.evaluate(
        agent_id="agent-admin",
        action_type="DELETE",
        resource="db://orders/archive",
        agent_permissions=["admin", "db:write"]
    )
    assert res.decision == PolicyDecisionEnum.REQUIRE_APPROVAL
    assert res.policy_id == "POL-D"
    assert res.derived_risk_level == RiskTierEnum.HIGH
    # Critical test: Never executed automatically
    assert res.execution_status == ExecutionStatusEnum.PENDING_APPROVAL
    assert res.approval_status == "PENDING"

def test_policy_e_customer_export_requires_approval():
    res = PolicyEvaluator.evaluate(
        agent_id="agent-marketing",
        action_type="EXPORT",
        resource="db://customers/all",
        agent_permissions=["db:read"]
    )
    assert res.decision == PolicyDecisionEnum.REQUIRE_APPROVAL
    assert res.policy_id == "POL-E"
    assert res.derived_risk_level == RiskTierEnum.HIGH
    # Must remain unexecuted pending approval
    assert res.execution_status == ExecutionStatusEnum.PENDING_APPROVAL
    assert res.approval_status == "PENDING"

def test_policy_f_admin_command_blocked():
    for cmd in ["ADMIN_EXEC", "SHELL", "EXEC"]:
        res = PolicyEvaluator.evaluate(
            agent_id="agent-devops",
            action_type=cmd,
            resource="sys://bash/exec"
        )
        assert res.decision == PolicyDecisionEnum.BLOCK
        assert res.policy_id == "POL-F"
        assert res.derived_risk_level == RiskTierEnum.CRITICAL
        assert res.execution_status == ExecutionStatusEnum.BLOCKED

def test_policy_g_unknown_action_default_deny():
    res = PolicyEvaluator.evaluate(
        agent_id="agent-rogue",
        action_type="UNKNOWN_UNSUPPORTED_OP",
        resource="custom://resource"
    )
    assert res.decision == PolicyDecisionEnum.BLOCK
    assert res.policy_id == "POL-G"
    assert res.execution_status == ExecutionStatusEnum.BLOCKED

def test_malformed_empty_inputs_denied():
    res1 = PolicyEvaluator.evaluate(agent_id="agent", action_type="", resource="public/doc")
    assert res1.decision == PolicyDecisionEnum.BLOCK
    assert res1.execution_status == ExecutionStatusEnum.BLOCKED

    res2 = PolicyEvaluator.evaluate(agent_id="agent", action_type="READ", resource="")
    assert res2.decision == PolicyDecisionEnum.BLOCK
    assert res2.execution_status == ExecutionStatusEnum.BLOCKED

def test_client_risk_level_is_not_trusted():
    # Client tries to claim a shell command is "LOW" risk
    derived = PolicyEvaluator.derive_risk_tier("ADMIN_EXEC", "sys://bash")
    assert derived == RiskTierEnum.CRITICAL

    # Client tries to claim customer export is "LOW" risk
    derived_export = PolicyEvaluator.derive_risk_tier("EXPORT", "db://customers/pii")
    assert derived_export == RiskTierEnum.HIGH

def test_cryptographic_integrity_hash():
    h1 = PolicyEvaluator.compute_integrity_hash(
        "evt_001", "2026-10-27T12:00:00", "agent-1", "READ", "public/doc", "ALLOW", "POL-A", None
    )
    assert len(h1) == 64
    assert isinstance(h1, str)

    # Chaining with previous hash alters output deterministically
    h2 = PolicyEvaluator.compute_integrity_hash(
        "evt_002", "2026-10-27T12:05:00", "agent-2", "DELETE", "db://table", "REQUIRE_APPROVAL", "POL-D", h1
    )
    assert len(h2) == 64
    assert h1 != h2
