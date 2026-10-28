export type PolicyDecision = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL';
export type ExecutionStatus = 'EXECUTED_SIMULATED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'APPROVED_SIMULATED' | 'REJECTED';
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEventSummary {
  id: string;
  timestamp: string;
  agent_id: string;
  action_type: string;
  resource: string;
  policy_decision: PolicyDecision;
  policy_id: string;
  policy_version: string;
  reason: string;
  execution_mode: string;
  execution_status: ExecutionStatus;
  approval_status: string;
  integrity_hash: string;
}

export interface AuditEventDetail extends AuditEventSummary {
  request_id?: string;
  event_metadata: string;
  previous_event_hash?: string;
  approval_decision?: {
    decision: string;
    approver_id: string;
    note?: string;
    decided_at?: string;
  };
  integrity_record?: IntegrityRecord;
}

export interface AuditEventListResponse {
  total: number;
  page: number;
  page_size: number;
  events: AuditEventSummary[];
}

export interface DashboardStats {
  total_events: number;
  allowed_count: number;
  blocked_count: number;
  pending_approvals_count: number;
  system_status: {
    frontend: string;
    backend: string;
    database: string;
    blockchain: string;
  };
  recent_events: AuditEventSummary[];
  events_by_date: Array<{
    date: string;
    total: number;
    allowed: number;
    blocked: number;
  }>;
}

export interface ActionEvaluateRequest {
  agent_id: string;
  action_type: string;
  resource: string;
  client_risk_level?: string;
  reason?: string;
  parameters?: Record<string, any>;
}

export interface ActionEvaluateResponse {
  event_id: string;
  decision: PolicyDecision;
  policy_id: string;
  policy_name: string;
  reason: string;
  derived_risk_level: RiskTier;
  execution_mode: string;
  execution_status: ExecutionStatus;
  approval_status: string;
  timestamp: string;
  integrity_hash: string;
  previous_event_hash?: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  action_pattern: string;
  resource_pattern: string;
  decision: PolicyDecision;
  risk_tier: RiskTier;
  version: string;
  is_active: boolean;
}

export interface ApprovalDecisionPayload {
  decision: 'APPROVED' | 'REJECTED';
  approver_id: string;
  note?: string;
}

export interface ApprovalDecisionResponse {
  event_id: string;
  status: string;
  execution_status: string;
  decision: string;
  approver_id: string;
  decided_at: string;
  integrity_hash: string;
  message: string;
}

export type IntegrityStatus = 'INTACT' | 'TAMPERED' | 'ANCHORED_AND_VERIFIED' | 'NOT_ANCHORED' | 'VERIFICATION_UNAVAILABLE' | 'UNVERIFIED';

export interface IntegrityRecord {
  id: string;
  event_id: string;
  hash_algorithm: string;
  canonical_version: string;
  event_hash: string;
  created_at: string;
  blockchain_network?: string;
  chain_id?: number;
  contract_address?: string;
  transaction_hash?: string;
  block_number?: number;
  anchoring_status: 'NOT_ANCHORED' | 'PENDING' | 'ANCHORED' | 'FAILED';
  anchored_at?: string;
  verification_status: IntegrityStatus;
  last_verified_at?: string;
  verification_details?: string;
}

export interface IntegrityVerificationResult {
  event_id: string;
  status: IntegrityStatus;
  local_matches: boolean;
  onchain_matches?: boolean | null;
  onchain_exists: boolean;
  calculated_hash: string;
  stored_hash?: string;
  onchain_hash?: string;
  blockchain_network?: string;
  chain_id?: number;
  contract_address?: string;
  transaction_hash?: string;
  block_number?: number;
  last_verified_at?: string;
  message: string;
}

export interface IntegrityAnchorResponse {
  event_id: string;
  status: string;
  transaction_hash: string;
  block_number: number;
  contract_address: string;
  chain_id: number;
  network_name: string;
  anchored_at: string;
  message: string;
}

export interface BlockchainStatus {
  mode: 'READY' | 'DISCONNECTED' | 'CONNECTED_NO_CONTRACT' | 'UNCONFIGURED';
  connected: boolean;
  rpc_url: string;
  configured_chain_id: number;
  detected_chain_id?: number | null;
  latest_block?: number | null;
  contract_address: string;
  has_contract: boolean;
  signer_address?: string | null;
  network_name: string;
  description: string;
  total_anchors: number;
  total_verified: number;
  total_tampered: number;
  explorer_base_url?: string | null;
  contract_explorer_url?: string | null;
  native_token?: string;
  faucet_url?: string | null;
}

export interface BlockchainTransaction {
  transaction_hash: string;
  event_id: string;
  contract_address: string;
  chain_id: number;
  network_name: string;
  submitter_address?: string;
  block_number?: number;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  timestamp?: string;
  explorer_url?: string;
  event_type?: string;
  canonical_hash?: string;
}

export type UserRole = 'ADMIN' | 'SECURITY_ANALYST' | 'VIEWER';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface TamperAlert {
  id: string;
  event_id: string;
  detection_timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  trusted_source: string;
  expected_hash: string;
  calculated_hash: string;
  details: string;
  resolved_by?: string | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
}

export interface SecurityAnalytics {
  summary: {
    total_events: number;
    allowed: number;
    blocked: number;
    require_approval: number;
    total_anchored: number;
    open_tamper_alerts: number;
    resolved_tamper_alerts: number;
  };
  action_distribution: Record<string, number>;
  agent_activity: Array<{
    agent_id: string;
    event_count: number;
  }>;
  integrity_breakdown: Record<string, number>;
}

// ==========================================
// Phase 6: Threat Detection & Trust Profiles
// ==========================================

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FindingStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface FindingAuditLog {
  id: string;
  finding_id: string;
  action: string;
  previous_status?: string | null;
  new_status: string;
  performed_by: string;
  notes?: string | null;
  timestamp: string;
}

export interface SecurityFinding {
  id: string;
  finding_id: string;
  rule_id: string;
  rule_version: string;
  agent_id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  description: string;
  recommended_action: string;
  evidence_event_ids: string[];
  detected_at: string;
  is_simulation: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  finding_metadata?: Record<string, any>;
  evidence_events?: AuditEventDetail[];
  audit_logs?: FindingAuditLog[];
}

export interface DetectionRule {
  rule_id: string;
  name: string;
  version: string;
  severity: FindingSeverity;
  description: string;
  window_minutes: number;
  threshold: number;
  recommended_action: string;
  is_enabled: boolean;
}

export interface RiskScoreFactor {
  factor_name: string;
  raw_metric: string;
  points_contributed: number;
  max_points: number;
  description: string;
}

export interface AgentRiskScoreBreakdown {
  risk_score: number;
  risk_tier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' | 'INSUFFICIENT_DATA';
  observation_window_hours: number;
  sample_size: number;
  insufficient_data: boolean;
  factors: RiskScoreFactor[];
  formula_disclaimer: string;
}

export interface AgentTrustProfile {
  agent_id: string;
  agent_name: string;
  role: string;
  status: string;
  total_actions: number;
  allowed_actions: number;
  blocked_actions: number;
  approval_required_actions: number;
  blocked_ratio: number;
  violations_count: number;
  active_findings_count: number;
  integrity_failures_count: number;
  last_activity_timestamp?: string | null;
  behavioral_risk_tier: string;
  evidence_integrity_status: string;
  blockchain_anchoring_status: string;
  risk_score_breakdown: AgentRiskScoreBreakdown;
  applicable_policies: string[];
}

export interface ThreatAnalytics {
  total_findings: number;
  active_findings: number;
  investigating_findings: number;
  resolved_findings: number;
  false_positives: number;
  findings_by_severity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  top_triggered_rules: Array<{
    rule_id: string;
    count: number;
    name: string;
  }>;
  agents_under_review: string[];
  last_detection_run?: string | null;
  rules_registered: number;
}

export interface LabScenarioResult {
  scenario_id: string;
  scenario_name: string;
  description: string;
  actions_evaluated: number;
  findings_triggered: number;
  findings: SecurityFinding[];
  explanation: string;
}

// ==============================================================
// Phase 8: Autonomous Security Governance & Provenance Assurance
// ==============================================================

export interface GovernanceExplanation {
  event_id: string;
  request_id?: string | null;
  agent_id: string;
  agent_name: string;
  action_type: string;
  resource: string;
  parameters: Record<string, any>;
  policy_id: string;
  policy_version: string;
  policy_decision: PolicyDecision;
  decision_reason: string;
  derived_risk_level: string;
  agent_behavioral_risk_tier: string;
  integrity_hash: string;
  local_verification_status: 'INTACT' | 'TAMPERED' | 'UNVERIFIED';
  blockchain_anchoring_status: 'ANCHORED' | 'NOT_ANCHORED' | 'FAILED';
  blockchain_verification_status: 'ANCHORED_AND_VERIFIED' | 'NOT_ANCHORED' | 'RPC_DISCONNECTED' | 'ONCHAIN_MISMATCH';
  transaction_hash?: string | null;
  contract_address?: string | null;
  approval_status: string;
  approval_decision?: {
    decision_id: string;
    decision: string;
    approver_id: string;
    note?: string | null;
    decided_at?: string | null;
  } | null;
  related_findings: Array<{
    finding_id: string;
    rule_id: string;
    title: string;
    severity: FindingSeverity;
    status: FindingStatus;
  }>;
  related_incidents: Array<{
    incident_id: string;
    title: string;
    severity: string;
    status: string;
  }>;
  timestamp: string;
  provenance_chain_complete: boolean;
  provenance_disclaimer: string;
}

export interface PolicyVersionHistory {
  id: string;
  policy_id: string;
  version: string;
  name: string;
  description: string;
  action_pattern: string;
  resource_pattern: string;
  decision: string;
  risk_tier: string;
  changed_by: string;
  change_reason?: string | null;
  created_at: string;
}

export interface GovernanceDashboardSummary {
  total_evaluated_actions: number;
  allowed_count: number;
  blocked_count: number;
  pending_approvals_count: number;
  total_policies: number;
  total_policy_versions: number;
  active_threat_findings: number;
  open_incidents: number;
  quarantined_agents: number;
  cryptographic_integrity_rate: number;
  blockchain_anchored_rate: number;
  recent_governance_actions: Array<{
    event_id: string;
    agent_id: string;
    action_type: string;
    resource: string;
    decision: string;
    timestamp: string;
  }>;
}

export interface EvidenceInspectorResponse {
  evidence_id: string;
  event_id: string;
  agent_id: string;
  action_type: string;
  resource: string;
  action_summary: string;
  policy_decision: string;
  policy_id: string;
  policy_version: string;
  canonical_version: string;
  canonical_payload: Record<string, any>;
  recomputed_hash: string;
  stored_commitment?: string | null;
  contract_address?: string | null;
  transaction_hash?: string | null;
  block_number?: number | null;
  anchoring_status: string;
  anchored_at?: string | null;
  network_name?: string | null;
  chain_id?: number | null;
  explorer_url?: string | null;
  contract_explorer_url?: string | null;
  verification_status: string;
  independent_verification: {
    local_matches: boolean;
    onchain_matches?: boolean | null;
    onchain_exists: boolean;
    status: string;
    message: string;
    verified_at?: string;
  };
  approval_history?: Record<string, any> | null;
}




