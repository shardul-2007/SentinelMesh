import {
  DashboardStats,
  AuditEventListResponse,
  AuditEventDetail,
  ActionEvaluateRequest,
  ActionEvaluateResponse,
  SecurityPolicy,
  AuditEventSummary,
  ApprovalDecisionPayload,
  ApprovalDecisionResponse,
  BlockchainStatus,
  IntegrityRecord,
  IntegrityVerificationResult,
  IntegrityAnchorResponse,
  UserProfile,
  LoginResponse,
  TamperAlert,
  SecurityAnalytics,
  SecurityFinding,
  DetectionRule,
  AgentTrustProfile,
  ThreatAnalytics,
  LabScenarioResult,
  GovernanceExplanation,
  PolicyVersionHistory,
  GovernanceDashboardSummary
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const DEFAULT_ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'sentinel-admin-dev-key-phase1';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sentinel_auth_token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sentinel_auth_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sentinel_auth_token');
    localStorage.removeItem('sentinel_current_user');
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Fallback dev admin key
  headers['X-Admin-Key'] = DEFAULT_ADMIN_KEY;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // System Health
  async getHealth(): Promise<{ status: string; database: string; blockchain_integration: { status: string; connected: boolean; network?: string } }> {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    return handleResponse(res);
  },

  // Auth & Roles
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<LoginResponse>(res);
    setAuthToken(data.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinel_current_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<UserProfile>(res);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // ignore logout network errors
    } finally {
      removeAuthToken();
    }
  },

  async getDemoAccounts(): Promise<Array<{ username: string; role: string; name: string; description: string }>> {
    const res = await fetch(`${API_BASE}/api/auth/demo-accounts`, { cache: 'no-store' });
    return handleResponse(res);
  },

  // Dashboard & Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/api/dashboard/stats`, { cache: 'no-store' });
    return handleResponse<DashboardStats>(res);
  },

  async getSecurityAnalytics(): Promise<SecurityAnalytics> {
    const res = await fetch(`${API_BASE}/api/reports/analytics`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<SecurityAnalytics>(res);
  },

  // Events & Audit Trail
  async getEvents(params?: {
    page?: number;
    page_size?: number;
    decision?: string;
    agent_id?: string;
    search?: string;
  }): Promise<AuditEventListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.page_size) query.set('page_size', params.page_size.toString());
    if (params?.decision && params.decision !== 'ALL') query.set('decision', params.decision);
    if (params?.agent_id) query.set('agent_id', params.agent_id);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/api/events?${query.toString()}`, { cache: 'no-store' });
    return handleResponse<AuditEventListResponse>(res);
  },

  async getEventDetail(eventId: string): Promise<AuditEventDetail> {
    const res = await fetch(`${API_BASE}/api/events/${eventId}`, { cache: 'no-store' });
    return handleResponse<AuditEventDetail>(res);
  },

  // Action Evaluation Simulator
  async evaluateAction(payload: ActionEvaluateRequest): Promise<ActionEvaluateResponse> {
    const res = await fetch(`${API_BASE}/api/actions/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ActionEvaluateResponse>(res);
  },

  // Policies
  async getPolicies(): Promise<SecurityPolicy[]> {
    const res = await fetch(`${API_BASE}/api/policies`, { cache: 'no-store' });
    return handleResponse<SecurityPolicy[]>(res);
  },

  // Approvals Workflow
  async getPendingApprovals(): Promise<AuditEventSummary[]> {
    const res = await fetch(`${API_BASE}/api/approvals`, { cache: 'no-store' });
    return handleResponse<AuditEventSummary[]>(res);
  },

  async submitApprovalDecision(
    eventId: string,
    payload: ApprovalDecisionPayload
  ): Promise<ApprovalDecisionResponse> {
    const res = await fetch(`${API_BASE}/api/approvals/${eventId}/decision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ApprovalDecisionResponse>(res);
  },

  // Integrity & Blockchain
  async getBlockchainStatus(): Promise<BlockchainStatus> {
    const res = await fetch(`${API_BASE}/api/integrity/status`, { cache: 'no-store' });
    return handleResponse<BlockchainStatus>(res);
  },

  async listIntegrityRecords(page = 1, pageSize = 20, status?: string): Promise<IntegrityRecord[]> {
    const query = new URLSearchParams();
    query.set('page', page.toString());
    query.set('page_size', pageSize.toString());
    if (status && status !== 'ALL') query.set('status', status);

    const res = await fetch(`${API_BASE}/api/integrity/events?${query.toString()}`, { cache: 'no-store' });
    return handleResponse<IntegrityRecord[]>(res);
  },

  async getIntegrityRecord(eventId: string): Promise<IntegrityRecord> {
    const res = await fetch(`${API_BASE}/api/integrity/events/${eventId}`, { cache: 'no-store' });
    return handleResponse<IntegrityRecord>(res);
  },

  async verifyEventIntegrity(eventId: string): Promise<IntegrityVerificationResult> {
    const res = await fetch(`${API_BASE}/api/integrity/events/${eventId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<IntegrityVerificationResult>(res);
  },

  async anchorEvent(eventId: string): Promise<IntegrityAnchorResponse> {
    const res = await fetch(`${API_BASE}/api/integrity/events/${eventId}/anchor`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<IntegrityAnchorResponse>(res);
  },

  // Tamper Alerts & Simulation (Demo / Buildathon Testing)
  async getTamperAlerts(statusFilter?: string): Promise<TamperAlert[]> {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetch(`${API_BASE}/api/integrity/alerts${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<TamperAlert[]>(res);
  },

  async resolveTamperAlert(alertId: string, resolutionNote: string): Promise<TamperAlert> {
    const res = await fetch(`${API_BASE}/api/integrity/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolution_note: resolutionNote }),
    });
    return handleResponse<TamperAlert>(res);
  },

  async simulateTamper(eventId?: string, tamperedResource?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/integrity/simulate-tamper`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ event_id: eventId, tampered_resource: tamperedResource }),
    });
    return handleResponse(res);
  },

  async restoreTamper(eventId?: string): Promise<any> {
    const query = eventId ? `?event_id=${eventId}` : '';
    const res = await fetch(`${API_BASE}/api/integrity/restore-tamper${query}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Export Compliance Report
  getExportUrl(format: 'json' | 'csv', filters?: { decision?: string; agentId?: string; integrityStatus?: string }): string {
    const query = new URLSearchParams();
    query.set('format', format);
    if (filters?.decision && filters.decision !== 'ALL') query.set('decision', filters.decision);
    if (filters?.agentId) query.set('agent_id', filters.agentId);
    if (filters?.integrityStatus && filters.integrityStatus !== 'ALL') query.set('integrity_status', filters.integrityStatus);
    return `${API_BASE}/api/reports/export?${query.toString()}`;
  },

  // ==========================================
  // Phase 6: Threat Detection & Trust Profiles
  // ==========================================
  async getThreatRules(): Promise<DetectionRule[]> {
    const res = await fetch(`${API_BASE}/api/threats/rules`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<DetectionRule[]>(res);
  },

  async runThreatDetection(agentId?: string, includeSimulation = false): Promise<any> {
    const query = new URLSearchParams();
    if (agentId) query.set('agent_id', agentId);
    if (includeSimulation) query.set('include_simulation', 'true');

    const res = await fetch(`${API_BASE}/api/threats/analyze?${query.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getFindings(params?: {
    agentId?: string;
    ruleId?: string;
    severity?: string;
    status?: string;
    isSimulation?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<SecurityFinding[]> {
    const query = new URLSearchParams();
    if (params?.agentId) query.set('agent_id', params.agentId);
    if (params?.ruleId) query.set('rule_id', params.ruleId);
    if (params?.severity && params.severity !== 'ALL') query.set('severity', params.severity);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.isSimulation !== undefined) query.set('is_simulation', params.isSimulation.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`${API_BASE}/api/threats/findings?${query.toString()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<SecurityFinding[]>(res);
  },

  async getFindingDetail(findingId: string): Promise<SecurityFinding> {
    const res = await fetch(`${API_BASE}/api/threats/findings/${findingId}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<SecurityFinding>(res);
  },

  async updateFindingStatus(findingId: string, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/threats/findings/${findingId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(res);
  },

  async getAgentTrustProfiles(): Promise<AgentTrustProfile[]> {
    const res = await fetch(`${API_BASE}/api/threats/agent-profiles`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<AgentTrustProfile[]>(res);
  },

  async getAgentTrustProfile(agentId: string): Promise<AgentTrustProfile> {
    const res = await fetch(`${API_BASE}/api/threats/agent-profiles/${agentId}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<AgentTrustProfile>(res);
  },

  async getThreatAnalytics(): Promise<ThreatAnalytics> {
    const res = await fetch(`${API_BASE}/api/threats/analytics`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<ThreatAnalytics>(res);
  },

  async runLabScenario(scenarioId: string): Promise<LabScenarioResult> {
    const res = await fetch(`${API_BASE}/api/threats/lab/run-scenario`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    return handleResponse<LabScenarioResult>(res);
  },

  async resetLab(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/threats/lab/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ==============================================================
  // Phase 8: Autonomous Security Governance & Provenance Assurance
  // ==============================================================
  async getGovernanceExplanation(eventId: string): Promise<GovernanceExplanation> {
    const res = await fetch(`${API_BASE}/api/governance/explain/${eventId}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<GovernanceExplanation>(res);
  },

  async getGovernanceOverview(): Promise<GovernanceDashboardSummary> {
    const res = await fetch(`${API_BASE}/api/governance/overview`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<GovernanceDashboardSummary>(res);
  },

  async getPolicyVersionHistory(policyId: string): Promise<PolicyVersionHistory[]> {
    const res = await fetch(`${API_BASE}/api/governance/policies/${policyId}/history`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse<PolicyVersionHistory[]>(res);
  },

  async updatePolicyVersion(policyId: string, payload: {
    name?: string;
    description?: string;
    decision?: string;
    risk_tier?: string;
    change_reason: string;
  }): Promise<PolicyVersionHistory> {
    const res = await fetch(`${API_BASE}/api/governance/policies/${policyId}/version`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<PolicyVersionHistory>(res);
  },

  getGovernanceReportUrl(format: 'json' | 'csv'): string {
    return `${API_BASE}/api/governance/report?format=${format}`;
  }
};
