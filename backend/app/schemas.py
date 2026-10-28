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
    idempotency_key: Optional[str] = Field(None, max_length=128, description="Optional client idempotency key to prevent double execution")

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

class SecurityPolicyCreateRequest(BaseModel):
    id: str = Field(..., min_length=2, max_length=64, description="Unique policy identifier e.g. POL-CUSTOM-01")
    name: str = Field(..., min_length=2, max_length=128)
    description: str = Field(..., min_length=5, max_length=500)
    action_pattern: str = Field(default="*")
    resource_pattern: str = Field(default="*")
    decision: str = Field(..., pattern="^(ALLOW|BLOCK|REQUIRE_APPROVAL)$")
    risk_tier: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    version: str = Field(default="1.0.0")

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
    explorer_base_url: Optional[str] = None
    contract_explorer_url: Optional[str] = None
    native_token: Optional[str] = None
    faucet_url: Optional[str] = None

class BlockchainTransactionResponse(BaseModel):
    transaction_hash: str
    event_id: str
    contract_address: str
    chain_id: int
    network_name: str
    submitter_address: Optional[str] = None
    block_number: Optional[int] = None
    status: str
    timestamp: Optional[datetime] = None
    explorer_url: Optional[str] = None
    canonical_hash: Optional[str] = None

class EvidenceInspectorResponse(BaseModel):
    evidence_id: str
    event_id: str
    agent_id: str
    action_type: str
    resource: str
    action_summary: str
    policy_decision: str
    policy_id: str
    policy_version: str
    canonical_version: str
    canonical_payload: Dict[str, Any]
    recomputed_hash: str
    stored_commitment: Optional[str] = None
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    anchoring_status: str
    anchored_at: Optional[datetime] = None
    network_name: Optional[str] = None
    chain_id: Optional[int] = None
    explorer_url: Optional[str] = None
    contract_explorer_url: Optional[str] = None
    verification_status: str
    independent_verification: Dict[str, Any]
    approval_history: Optional[Dict[str, Any]] = None


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


# ==============================================================
# Phase 7: Multi-Agent Registry, Gateway & Incident Correlation
# ==============================================================

class AgentStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    DEACTIVATED = "DEACTIVATED"
    QUARANTINED = "QUARANTINED"


class AgentCreateRequest(BaseModel):
    id: str = Field(..., min_length=3, max_length=64, description="Unique agent identifier, e.g. payment-bot-01")
    name: str = Field(..., min_length=2, max_length=128, description="Display name for the agent")
    role: str = Field(..., min_length=2, max_length=64, description="Functional role, e.g. FINANCE_EXECUTOR, DEVOPS_BOT")
    description: Optional[str] = Field(None, max_length=500, description="Purpose and operational bounds")
    permissions: List[str] = Field(default_factory=list, description="List of permission tags")
    assigned_policies: List[str] = Field(default_factory=list, description="Specific policy IDs assigned to this agent")


class AgentStatusUpdateRequest(BaseModel):
    status: AgentStatusEnum
    reason: Optional[str] = Field(None, max_length=500, description="Reason for status change or containment action")


class AgentDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: str
    description: Optional[str] = None
    permissions: List[str] = []
    assigned_policies: List[str] = []
    status: str
    created_at: datetime
    last_active_at: Optional[datetime] = None
    total_actions: int = 0
    active_findings_count: int = 0
    open_incidents_count: int = 0
    risk_tier: str = "INSUFFICIENT_DATA"


class IncidentSeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatusEnum(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class IncidentAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    action: str
    previous_status: Optional[str] = None
    new_status: str
    performed_by: str
    notes: Optional[str] = None
    timestamp: datetime


class SecurityIncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    title: str
    summary: str
    severity: IncidentSeverityEnum
    status: IncidentStatusEnum
    agent_id: str
    correlation_rule: str
    correlation_explanation: str
    finding_ids: List[str] = []
    evidence_event_ids: List[str] = []
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_summary: Optional[str] = None


class SecurityIncidentDetailResponse(SecurityIncidentResponse):
    findings: List[SecurityFindingResponse] = []
    evidence_events: List[AuditEventDetail] = []
    audit_logs: List[IncidentAuditLogResponse] = []


class IncidentStatusUpdateRequest(BaseModel):
    status: IncidentStatusEnum
    assigned_to: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = Field(None, max_length=1000)


class IncidentQuarantineRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Justification for quarantining agent")


class IncidentAnalyticsResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    investigating_incidents: int
    resolved_incidents: int
    critical_incidents: int
    quarantined_agents_count: int
    recent_incidents: List[SecurityIncidentResponse] = []


# ==============================================================
# Phase 8: Autonomous Security Governance & Provenance Assurance
# ==============================================================

class GovernanceExplanationResponse(BaseModel):
    event_id: str
    request_id: Optional[str] = None
    agent_id: str
    agent_name: str
    action_type: str
    resource: str
    parameters: Dict[str, Any] = {}
    policy_id: str
    policy_version: str
    policy_decision: str
    decision_reason: str
    derived_risk_level: str
    agent_behavioral_risk_tier: str
    integrity_hash: str
    local_verification_status: str  # INTACT, TAMPERED, UNVERIFIED
    blockchain_anchoring_status: str  # ANCHORED, NOT_ANCHORED, FAILED
    blockchain_verification_status: str  # ANCHORED_AND_VERIFIED, NOT_ANCHORED, RPC_DISCONNECTED
    transaction_hash: Optional[str] = None
    contract_address: Optional[str] = None
    approval_status: str
    approval_decision: Optional[Dict[str, Any]] = None
    related_findings: List[Dict[str, Any]] = []
    related_incidents: List[Dict[str, Any]] = []
    timestamp: datetime
    provenance_chain_complete: bool
    provenance_disclaimer: str


class PolicyVersionHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    policy_id: str
    version: str
    name: str
    description: str
    action_pattern: str
    resource_pattern: str
    decision: str
    risk_tier: str
    changed_by: str
    change_reason: Optional[str] = None
    created_at: datetime


class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=128)
    description: Optional[str] = Field(None, min_length=5, max_length=500)
    decision: Optional[PolicyDecisionEnum] = None
    risk_tier: Optional[RiskTierEnum] = None
    change_reason: str = Field(..., min_length=3, max_length=500, description="Mandatory audit justification for policy modification")


class GovernanceDashboardSummaryResponse(BaseModel):
    total_evaluated_actions: int
    allowed_count: int = 0
    blocked_count: int = 0
    pending_approvals_count: int = 0
    total_policies: int = 0
    total_policy_versions: int = 0
    active_threat_findings: int = 0
    open_incidents: int = 0
    quarantined_agents: int = 0
    cryptographic_integrity_rate: float
    blockchain_anchored_rate: float
    recent_governance_actions: List[Dict[str, Any]] = []




