from dataclasses import dataclass
from typing import Optional, List

@dataclass
class PolicyDefinition:
    id: str
    name: str
    description: str
    action_pattern: str
    resource_pattern: str
    decision: str  # ALLOW, BLOCK, REQUIRE_APPROVAL
    risk_tier: str  # LOW, MEDIUM, HIGH, CRITICAL
    version: str = "1.0.0"
    required_permission: Optional[str] = None

# Built-in SentinelMesh core security policies (A through G)
DEFAULT_POLICIES: List[PolicyDefinition] = [
    PolicyDefinition(
        id="POL-A",
        name="Public Resource Read Access",
        description="Public read operations are permitted when the target resource is classified as public.",
        action_pattern="READ",
        resource_pattern="public/*",
        decision="ALLOW",
        risk_tier="LOW",
        version="1.0.0"
    ),
    PolicyDefinition(
        id="POL-B",
        name="Restricted Resource Shield",
        description="Access to restricted resources is blocked unless the requester holds explicit authorized credentials.",
        action_pattern="*",
        resource_pattern="restricted/*",
        decision="BLOCK",
        risk_tier="HIGH",
        version="1.0.0",
        required_permission="sec:restricted_access"
    ),
    PolicyDefinition(
        id="POL-C",
        name="Database Record Update Control",
        description="Database updates require appropriate database write permission.",
        action_pattern="UPDATE",
        resource_pattern="db://*",
        decision="ALLOW",
        risk_tier="MEDIUM",
        version="1.0.0",
        required_permission="db:write"
    ),
    PolicyDefinition(
        id="POL-D",
        name="Database Deletion Protection",
        description="Database deletion requires explicit human approval and must not proceed automatically.",
        action_pattern="DELETE",
        resource_pattern="db://*",
        decision="REQUIRE_APPROVAL",
        risk_tier="HIGH",
        version="1.0.0"
    ),
    PolicyDefinition(
        id="POL-E",
        name="Customer Data Export Gate",
        description="Customer data exports require human approval and data export authorization.",
        action_pattern="EXPORT",
        resource_pattern="db://users/*|db://customers/*|export://*",
        decision="REQUIRE_APPROVAL",
        risk_tier="HIGH",
        version="1.0.0",
        required_permission="data:export"
    ),
    PolicyDefinition(
        id="POL-F",
        name="Administrative Command Sandbox Barrier",
        description="Administrative commands and OS shell executions are blocked by default in the simulator.",
        action_pattern="ADMIN_EXEC|EXEC|SHELL",
        resource_pattern="*",
        decision="BLOCK",
        risk_tier="CRITICAL",
        version="1.0.0"
    ),
    PolicyDefinition(
        id="POL-G",
        name="Default Deny Policy",
        description="Unknown, unmatched, or malformed actions are denied by default under zero-trust principles.",
        action_pattern="*",
        resource_pattern="*",
        decision="BLOCK",
        risk_tier="HIGH",
        version="1.0.0"
    )
]
