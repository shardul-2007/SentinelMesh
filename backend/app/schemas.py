from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class PolicyDecisionEnum(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"

class ExecutionStatusEnum(str, Enum):
    EXECUTED_SIMULATED = "EXECUTED_SIMULATED"
    BLOCKED = "BLOCKED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED_SIMULATED = "APPROVED_SIMULATED"
    REJECTED = "REJECTED"

class RiskTierEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ActionEvaluateRequest(BaseModel):
    agent_id: str = Field(..., min_length=1, max_length=64, description="ID or name of requesting AI agent")
    action_type: str = Field(..., min_length=1, max_length=64, description="Type of operation, e.g. READ, UPDATE, DELETE, EXPORT, ADMIN_EXEC")
    resource: str = Field(..., min_length=1, max_length=256, description="Target resource URI or identifier")
    client_risk_level: Optional[str] = Field(None, description="Client supplied risk level (untrusted, ignored in decision)")
    reason: Optional[str] = Field(None, max_length=500, description="Optional explanation or intent for the action")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Structured action parameters")

    @field_validator("action_type")
    @classmethod
    def normalize_action(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("resource")
    @classmethod
    def normalize_resource(cls, v: str) -> str:
        return v.strip()

class ActionEvaluateResponse(BaseModel):
    event_id: str
    decision: PolicyDecisionEnum
    policy_id: str
    policy_name: str
    reason: str
    derived_risk_level: RiskTierEnum
    execution_mode: str = "SIMULATED"
    execution_status: ExecutionStatusEnum
    approval_status: str
    timestamp: datetime
    integrity_hash: str
    previous_event_hash: Optional[str] = None

class AuditEventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    agent_id: str
    action_type: str
    resource: str
    policy_decision: str
    policy_id: str
    policy_version: str
    reason: str
    execution_mode: str
    execution_status: str
    approval_status: str
    integrity_hash: str

class AuditEventDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: Optional[str] = None
    timestamp: datetime
    agent_id: str
    action_type: str
    resource: str
    policy_decision: str
    policy_id: str
    policy_version: str
    reason: str
    execution_mode: str
    execution_status: str
    approval_status: str
    event_metadata: str
    integrity_hash: str
    previous_event_hash: Optional[str] = None
    approval_decision: Optional[Dict[str, Any]] = None
    integrity_record: Optional[Dict[str, Any]] = None

class AuditEventListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    events: List[AuditEventSummary]

class DashboardStatsResponse(BaseModel):
    total_events: int
    allowed_count: int
    blocked_count: int
    pending_approvals_count: int
    system_status: Dict[str, str]
    recent_events: List[AuditEventSummary]
    events_by_date: List[Dict[str, Any]]

class SecurityPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    action_pattern: str
    resource_pattern: str
    decision: str
    risk_tier: str
    version: str
    is_active: bool

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(APPROVED|REJECTED)$", description="Approval decision: APPROVED or REJECTED")
    approver_id: str = Field(default="security-admin", min_length=1, max_length=64)
    note: Optional[str] = Field(None, max_length=500)

class ApprovalDecisionResponse(BaseModel):
    event_id: str
    status: str
    execution_status: str
    decision: str
    approver_id: str
    decided_at: datetime
    integrity_hash: str
    message: str

class IntegrityRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    hash_algorithm: str
    canonical_version: str
    event_hash: str
    created_at: datetime
    blockchain_network: Optional[str] = None
    chain_id: Optional[int] = None
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    anchoring_status: str
    anchored_at: Optional[datetime] = None
    verification_status: str
    last_verified_at: Optional[datetime] = None
    verification_details: Optional[str] = None

class IntegrityVerificationResponse(BaseModel):
    event_id: str
    status: str  # INTACT, TAMPERED, ANCHORED_AND_VERIFIED, NOT_ANCHORED, VERIFICATION_UNAVAILABLE
    local_matches: bool
    onchain_matches: Optional[bool] = None
    onchain_exists: bool
    calculated_hash: str
    stored_hash: Optional[str] = None
    onchain_hash: Optional[str] = None
    blockchain_network: Optional[str] = None
    chain_id: Optional[int] = None
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    last_verified_at: Optional[datetime] = None
    message: str

class IntegrityAnchorResponse(BaseModel):
    event_id: str
    status: str
    transaction_hash: str
    block_number: int
    contract_address: str
    chain_id: int
    network_name: str
    anchored_at: datetime
    message: str

class BlockchainStatusResponse(BaseModel):
    mode: str
    connected: bool
    rpc_url: str
    configured_chain_id: int
    detected_chain_id: Optional[int] = None
    latest_block: Optional[int] = None
    contract_address: str
    has_contract: bool
    signer_address: Optional[str] = None
    network_name: str
    description: str
    total_anchors: int
    total_verified: int
    total_tampered: int


# ==========================================
# Phase 6: Threat Detection & Trust Profiles
# ==========================================

class FindingSeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FindingStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class FindingAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    finding_id: str
    action: str
    previous_status: Optional[str] = None
    new_status: str
    performed_by: str
    notes: Optional[str] = None
    timestamp: datetime


class SecurityFindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    finding_id: str
    rule_id: str
    rule_version: str
    agent_id: str
    severity: FindingSeverityEnum
    status: FindingStatusEnum
    title: str
    description: str
    recommended_action: str
    evidence_event_ids: List[str] = []
    detected_at: datetime
    is_simulation: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    finding_metadata: Dict[str, Any] = {}


class SecurityFindingDetailResponse(SecurityFindingResponse):
    evidence_events: List[AuditEventDetail] = []
    audit_logs: List[FindingAuditLogResponse] = []


class FindingStatusUpdateRequest(BaseModel):
    status: FindingStatusEnum
    notes: Optional[str] = Field(None, max_length=1000, description="Analyst investigation notes")


class DetectionRuleResponse(BaseModel):
    rule_id: str
    name: str
    version: str
    severity: FindingSeverityEnum
    description: str
    window_minutes: int
    threshold: int
    recommended_action: str
    is_enabled: bool = True


class RiskScoreFactor(BaseModel):
    factor_name: str
    raw_metric: str
    points_contributed: int
    max_points: int
    description: str


class AgentRiskScoreBreakdown(BaseModel):
    risk_score: int  # 0 to 100
    risk_tier: str  # LOW, MODERATE, ELEVATED, CRITICAL, INSUFFICIENT_DATA
    observation_window_hours: int
    sample_size: int
    insufficient_data: bool
    factors: List[RiskScoreFactor]
    formula_disclaimer: str


class AgentTrustProfileResponse(BaseModel):
    agent_id: str
    agent_name: str
    role: str
    status: str
    total_actions: int
    allowed_actions: int
    blocked_actions: int
    approval_required_actions: int
    blocked_ratio: float
    violations_count: int
    active_findings_count: int
    integrity_failures_count: int
    last_activity_timestamp: Optional[datetime] = None
    
    # 3 Distinct Orthogonal Security Indicators
    behavioral_risk_tier: str  # Heuristic index
    evidence_integrity_status: str  # Local cryptographic verification
    blockchain_anchoring_status: str  # EVM on-chain verification
    
    risk_score_breakdown: AgentRiskScoreBreakdown
    applicable_policies: List[str] = []


class ThreatAnalyticsResponse(BaseModel):
    total_findings: int
    active_findings: int
    investigating_findings: int
    resolved_findings: int
    false_positives: int
    findings_by_severity: Dict[str, int]
    top_triggered_rules: List[Dict[str, Any]]
    agents_under_review: List[str]
    last_detection_run: Optional[datetime] = None
    rules_registered: int


class LabScenarioRunRequest(BaseModel):
    scenario_id: str = Field(..., description="ID of scenario: SCENARIO_NORMAL, SCENARIO_REPEATED_BLOCKED, SCENARIO_VELOCITY_BURST, SCENARIO_POLICY_VIOLATIONS, SCENARIO_INTEGRITY_TAMPER")


class LabScenarioRunResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    description: str
    actions_evaluated: int
    findings_triggered: int
    findings: List[SecurityFindingResponse]
    explanation: str


