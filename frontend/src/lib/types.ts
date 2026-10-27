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


