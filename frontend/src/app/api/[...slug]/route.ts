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

    // PayPal Status
    if (path === 'paypal/status') {
      const data = backendEngine.getPayPalStatus();
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
      const status = searchParams.get('status') || undefined;
      const data = backendEngine.getIntegrityRecords(page, pageSize, status);
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (slug[0] === 'integrity' && slug[1] === 'events' && slug.length === 3) {
      const eventId = slug[2];
      const data = backendEngine.getIntegrityRecord(eventId);
      if (!data) return NextResponse.json({ detail: 'Integrity record not found' }, { status: 404, headers: corsHeaders() });
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
      const status = searchParams.get('status') || undefined;
      const data = backendEngine.getTamperAlerts(status);
      return NextResponse.json(data, { headers: corsHeaders() });
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

    if (slug[0] === 'threats' && slug[1] === 'findings' && slug.length === 3) {
      const findingId = slug[2];
      const data = backendEngine.getFindingDetail(findingId);
      if (!data) return NextResponse.json({ detail: 'Finding not found' }, { status: 404, headers: corsHeaders() });
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'threats/agent-profiles') {
      const data = backendEngine.getAgentTrustProfiles();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'threats/analytics') {
      const data = backendEngine.getThreatAnalytics();
      return NextResponse.json(data, { headers: corsHeaders() });
    }

    if (path === 'threats/analyze') {
      return NextResponse.json({
        status: 'COMPLETED',
        analyzed_events: backendEngine.getAllEventsRaw().length,
        flagged_findings: backendEngine.getThreatFindings().length,
      }, { headers: corsHeaders() });
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

    if (path === 'governance/report' || path === 'reports/export') {
      const format = (searchParams.get('format') || 'json').toLowerCase();
      if (format === 'csv') {
        const csv = backendEngine.exportEventsCsv();
        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="sentinelmesh_governance_report.csv"',
          },
        });
      }
      return NextResponse.json({
        generated_at: new Date().toISOString(),
        overview: backendEngine.getGovernanceOverview(),
        events: backendEngine.getAllEventsRaw(),
        policies: backendEngine.getPolicies(),
      }, { headers: corsHeaders() });
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
        { username: 'admin', role: 'ADMIN', name: 'Chief Security Officer', description: 'Full access to policies, approvals, and blockchain anchoring' },
        { username: 'analyst', role: 'SECURITY_ANALYST', name: 'Lead Security Analyst', description: 'Can inspect evidence, verify digests, and view logs' },
        { username: 'viewer', role: 'VIEWER', name: 'Compliance Auditor', description: 'Read-only access to audit trail' }
      ], { headers: corsHeaders() });
    }

    // 10. Reports
    if (path === 'reports/analytics') {
      const analytics = backendEngine.getSecurityAnalytics();
      return NextResponse.json(analytics, { headers: corsHeaders() });
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

    // PayPal Governed Order
    if (path === 'paypal/governed-order') {
      const data = backendEngine.createGovernedPayPalOrder(body);
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

    if (path === 'integrity/simulate-tamper') {
      const data = backendEngine.simulateTamper(body.event_id, body.tampered_resource);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    if (path === 'integrity/restore-tamper') {
      const { searchParams } = new URL(request.url);
      const eventId = searchParams.get('event_id') || body.event_id || undefined;
      const data = backendEngine.restoreTamper(eventId);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    if (slug[0] === 'integrity' && slug[1] === 'alerts' && slug[3] === 'resolve' && slug.length === 4) {
      const alertId = slug[2];
      const data = backendEngine.resolveTamperAlert(alertId, body.resolution_note || '');
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 4. Policies Create & Toggle
    if (path === 'policies') {
      const data = backendEngine.createPolicy(body);
      return NextResponse.json(data, { status: 201, headers: corsHeaders() });
    }

    if (slug[0] === 'policies' && slug[2] === 'toggle' && slug.length === 3) {
      const policyId = decodeURIComponent(slug[1]);
      const data = backendEngine.togglePolicy(policyId);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

    // 5. Threat Detection & Lab Runner
    if (path === 'threats/analyze') {
      return NextResponse.json({
        status: 'COMPLETED',
        analyzed_events: backendEngine.getAllEventsRaw().length,
        flagged_findings: backendEngine.getThreatFindings().length,
      }, { status: 200, headers: corsHeaders() });
    }

    if (slug[0] === 'threats' && slug[1] === 'findings' && slug[3] === 'status' && slug.length === 4) {
      const findingId = slug[2];
      const data = backendEngine.updateFindingStatus(findingId, body.status || 'INVESTIGATING', body.notes);
      return NextResponse.json(data, { status: 200, headers: corsHeaders() });
    }

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
