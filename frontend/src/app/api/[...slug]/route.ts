import { NextRequest, NextResponse } from 'next/server';
import { backendEngine } from '@/lib/server/backendEngine';

export const dynamic = 'force-dynamic';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join('/');
  const { searchParams } = new URL(request.url);

  try {
    // 1. Health
    if (path === 'health') {
      const data = await backendEngine.getHealth();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    // 2. Dashboard Stats
    if (path === 'dashboard/stats') {
      const data = await backendEngine.getDashboardStats();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    // 3. Events
    if (path === 'events') {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('page_size') || '50', 10);
      const search = searchParams.get('search') || undefined;
      const decision = searchParams.get('decision') || undefined;
      const data = backendEngine.getEvents({ page, page_size: pageSize, search, decision });
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (slug[0] === 'events' && slug.length === 2) {
      const eventId = slug[1];
      const data = backendEngine.getEvent(eventId);
      if (!data) return NextResponse.json({ detail: 'Event not found' }, { status: 404, headers: corsHeaders() });
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    // 4. Policies
    if (path === 'policies') {
      const data = backendEngine.getPolicies();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    // 5. Approvals
    if (path === 'approvals') {
      const data = backendEngine.getPendingApprovals();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    // 6. Integrity & Blockchain
    if (path === 'integrity/status') {
      const data = await backendEngine.getBlockchainStatus();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'integrity/events') {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('page_size') || '50', 10);
      const search = searchParams.get('search') || undefined;
      const data = backendEngine.getEvents({ page, page_size: pageSize, search });
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (slug[0] === 'integrity' && slug[1] === 'events' && slug.length === 3) {
      const eventId = slug[2];
      const data = backendEngine.getEvent(eventId);
      if (!data) return NextResponse.json({ detail: 'Event not found' }, { status: 404, headers: corsHeaders() });
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'integrity/transactions') {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('page_size') || '50', 10);
      const data = backendEngine.getBlockchainTransactions(page, pageSize);
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (slug[0] === 'integrity' && slug[1] === 'evidence' && slug.length === 3) {
      const eventId = slug[2];
      const data = backendEngine.getEvidenceInspector(eventId);
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'integrity/alerts') {
      return NextResponse.json([], { headers: corsHeaders() });
    }

    // 7. Threats
    if (path === 'threats/rules') {
      const data = backendEngine.getThreatRules();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'threats/findings') {
      const data = backendEngine.getThreatFindings();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'threats/agent-profiles') {
      return NextResponse.json([
        { agent_id: 'agent-data-analyzer', trust_score: 95, status: 'TRUSTED', risk_tier: 'LOW', total_actions: 34, violations_count: 0 },
        { agent_id: 'agent-guest', trust_score: 42, status: 'PROBATION', risk_tier: 'HIGH', total_actions: 6, violations_count: 2 },
        { agent_id: 'agent-financial-bot', trust_score: 88, status: 'TRUSTED', risk_tier: 'MEDIUM', total_actions: 18, violations_count: 0 }
      ], { headers: corsHeaders() });
    }

    if (path === 'threats/analytics') {
      const data = backendEngine.getThreatAnalytics();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'threats/analyze') {
      return NextResponse.json({ anomalies_found: 0, threat_score: 12, summary: 'Normal operational activity' }, { headers: corsHeaders() });
    }

    // 8. Governance
    if (path === 'governance/overview') {
      const data = backendEngine.getGovernanceOverview();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (slug[0] === 'governance' && slug[1] === 'explain' && slug.length === 3) {
      const eventId = slug[2];
      const data = backendEngine.explainGovernance(eventId);
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    // 9. Auth
    if (path === 'auth/me') {
      return NextResponse.json({
        id: 'usr_admin_001',
        username: 'admin',
        email: 'security-admin@sentinelmesh.io',
        full_name: 'Chief Security Officer',
        role: 'ADMIN',
        is_active: true
      }, { headers: corsHeaders() });
    }

    if (path === 'auth/demo-accounts') {
      return NextResponse.json([
        { username: 'admin', role: 'ADMIN', description: 'Full access to policies, approvals, and blockchain anchoring' },
        { username: 'analyst', role: 'SECURITY_ANALYST', description: 'Can inspect evidence, verify digests, and view logs' },
        { username: 'viewer', role: 'VIEWER', description: 'Read-only access to audit trail' }
      ], { headers: corsHeaders() });
    }

    // 10. Reports
    if (path === 'reports/analytics') {
      const stats = await backendEngine.getDashboardStats();
      return NextResponse.json(stats, { headers: corsHeaders() });
    }

    return NextResponse.json({ error: `Route /api/${path} not found` }, { status: 404, headers: corsHeaders() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join('/');

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty body
    }

    // 1. Action Evaluation
    if (path === 'actions/evaluate') {
      const data = await backendEngine.evaluateAction(body);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 2. Approvals Decision
    if (slug[0] === 'approvals' && slug[2] === 'decision' && slug.length === 3) {
      const eventId = slug[1];
      const decision = body.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
      const data = backendEngine.submitApprovalDecision(eventId, decision, body.note, body.approver_id);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 3. Integrity Verification & Anchoring
    if (slug[0] === 'integrity' && slug[1] === 'events' && slug[3] === 'verify' && slug.length === 4) {
      const eventId = slug[2];
      const data = await backendEngine.verifyEventIntegrity(eventId);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    if (slug[0] === 'integrity' && slug[1] === 'events' && slug[3] === 'anchor' && slug.length === 4) {
      const eventId = slug[2];
      const data = backendEngine.anchorEvent(eventId);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 4. Policies Toggle
    if (slug[0] === 'policies' && slug[2] === 'toggle' && slug.length === 3) {
      const policyId = decodeURIComponent(slug[1]);
      const data = backendEngine.togglePolicy(policyId);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 5. Threat Lab Runner
    if (path === 'threats/lab/run-scenario') {
      const data = backendEngine.runLabScenario(body.scenario_id || 'untrusted-probe');
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 6. Auth Login
    if (path === 'auth/login') {
      const username = body.username || 'admin';
      return NextResponse.json({
        access_token: `sentinel_token_${Date.now()}`,
        token_type: 'bearer',
        user: {
          id: 'usr_admin_001',
          username,
          email: `${username}@sentinelmesh.io`,
          full_name: username === 'admin' ? 'Chief Security Officer' : 'Security Analyst',
          role: username === 'admin' ? 'ADMIN' : 'SECURITY_ANALYST',
          is_active: true
        }
      }, { status: 200, headers: corsHeaders() });
    }

    if (path === 'auth/logout') {
      return NextResponse.json({ message: 'Logged out successfully' }, { status: 200, headers: corsHeaders() });
    }

    return NextResponse.json({ error: `Route /api/${path} not found` }, { status: 404, headers: corsHeaders() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}
