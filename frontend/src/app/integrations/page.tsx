'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Grid, 
  Bot, 
  Terminal, 
  Boxes, 
  Code2, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Bell,
  Cpu
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function IntegrationsPage() {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const pythonLangChainSnippet = `from sentinelmesh import SentinelMeshGateway, SentinelMeshToolGuard

# 1. Initialize SentinelMesh Zero-Trust Gateway
gateway = SentinelMeshGateway(
    endpoint="https://sentinelmesh-five.vercel.app/api/v1",
    api_key="sm_live_sec_prod_key_91562037",
    agent_id="agent-data-analyzer"
)

# 2. Wrap LangChain Tools with Deterministic Pre-Execution Guard
@SentinelMeshToolGuard(gateway=gateway, risk_tier="MEDIUM")
def update_analytics_database(table: str, data: dict):
    """Safely updates database under SentinelMesh policy gate."""
    return db.execute_update(table, data)

# 3. Execution evaluates policy: ALLOW, BLOCK, or REQUIRE_APPROVAL
result = update_analytics_database("daily_aggregates", {"metric": 100})
print("Gateway Decision:", result.decision)  # -> ALLOW
print("RFC-8785 Hash:", result.evidence_hash) # -> 0x2623...`;

  const nodeSdkSnippet = `import { SentinelMeshClient } from '@sentinelmesh/sdk';

const sm = new SentinelMeshClient({
  endpoint: 'https://sentinelmesh-five.vercel.app/api/v1',
  apiKey: process.env.SENTINELMESH_API_KEY,
  agentId: 'agent-financial-bot',
});

// Intercept action before execution
const evaluation = await sm.evaluateAction({
  actionType: 'EXPORT',
  resource: 'db://users/customer_identities',
  parameters: { limit: 1000 },
  clientRisk: 'HIGH'
});

if (evaluation.decision === 'REQUIRE_APPROVAL') {
  console.log('Action held. Approval ID:', evaluation.eventId);
} else if (evaluation.decision === 'ALLOW') {
  // Execute permitted operation
}`;

  const restApiSnippet = `curl -X POST https://sentinelmesh-five.vercel.app/api/v1/actions/evaluate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sm_live_sec_prod_key_91562037" \\
  -d '{
    "agent_id": "agent-financial-bot",
    "action_type": "DELETE",
    "resource": "db://ledger/transactions_2025",
    "parameters": {"batch_id": "2025-Q1"},
    "client_risk": "HIGH"
  }'`;

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Framework Integrations &amp; SDKs" 
        subtitle="Connect SentinelMesh Zero-Trust Gateway to LangChain, AutoGen, CrewAI, Node.js, and Python"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Intro Banner */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-bold uppercase tracking-wider">
              <Grid className="w-3.5 h-3.5" />
              Developer Ecosystem
            </span>
            <span className="text-xs text-[#64748B]">Zero-trust middleware for any agent runtime</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-[#172B4D]">
            Integrate SentinelMesh with Your AI Agent Stack
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-3xl">
            Drop SentinelMesh in front of tool calls, API requests, and database queries. Every evaluated action produces canonical RFC 8785 audit records and enables cryptographic anchoring to the MST Blockchain without modifying agent prompts.
          </p>
        </section>

        {/* 1. AI Agent Frameworks */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-[#172B4D]">AI Agent Framework Integrations</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* LangChain */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#172B4D]">LangChain &amp; LangGraph</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Native <code className="text-[#172B4D] font-mono">SentinelMeshCallbackHandler</code> and custom tool decorator to intercept LangChain tools before tool invocation.
                </p>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="font-mono text-[#15803D] font-semibold text-[11px]">pip install sentinelmesh</span>
                <span className="text-[#2563EB] font-bold">Python</span>
              </div>
            </div>

            {/* AutoGen */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#15803D]/10 flex items-center justify-center text-[#15803D]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#172B4D]">Microsoft AutoGen</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Zero-trust proxy middleware for <code className="text-[#172B4D] font-mono">ConversableAgent</code> and group chat orchestrators to intercept code execution and tool dispatch.
                </p>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="font-mono text-[#15803D] font-semibold text-[11px]">autogen-sentinelmesh</span>
                <span className="text-[#2563EB] font-bold">Python</span>
              </div>
            </div>

            {/* CrewAI */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 flex items-center justify-center text-[#D97706]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#172B4D]">CrewAI Autonomous Teams</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Enterprise security guardrails for multi-agent crews. Enforces role-based action privileges across research, financial, and executive agents.
                </p>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="font-mono text-[#15803D] font-semibold text-[11px]">crewai-mesh-guard</span>
                <span className="text-[#2563EB] font-bold">Python</span>
              </div>
            </div>

            {/* PayPal Developer Sandbox */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#2563EB]/40 shadow-xs flex flex-col justify-between space-y-4 ring-1 ring-[#2563EB]/10">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                  <Boxes className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#172B4D]">PayPal Developer Sandbox</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#15803D]/10 text-[#15803D]">LIVE SANDBOX</span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Zero-trust financial gateway evaluating AI agent payment actions, micro-payments vs high-value approval tiers, and OAuth2 checkout orders.
                </p>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <Link href="/paypal" className="font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
                  Open PayPal Studio &rarr;
                </Link>
                <span className="text-[#64748B] font-mono text-[11px]">REST v2</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Code Examples */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-[#172B4D]">Code Implementation Examples</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Python Example */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172B4D]">Python SDK (LangChain Tool Guard)</span>
                </div>
                <button
                  onClick={() => copyCode('py', pythonLangChainSnippet)}
                  className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172B4D] transition flex items-center gap-1 text-[11px]"
                >
                  {copiedSnippet === 'py' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'py' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-xs text-[#172B4D] overflow-x-auto leading-relaxed">
                {pythonLangChainSnippet}
              </pre>
            </div>

            {/* TypeScript Example */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172B4D]">TypeScript / Node.js Client</span>
                </div>
                <button
                  onClick={() => copyCode('ts', nodeSdkSnippet)}
                  className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172B4D] transition flex items-center gap-1 text-[11px]"
                >
                  {copiedSnippet === 'ts' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === 'ts' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-xs text-[#172B4D] overflow-x-auto leading-relaxed">
                {nodeSdkSnippet}
              </pre>
            </div>
          </div>
        </section>

        {/* 3. REST API Specification */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#172B4D]">Direct REST API Endpoint</h3>
            </div>
            <button
              onClick={() => copyCode('curl', restApiSnippet)}
              className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172B4D] transition flex items-center gap-1 text-[11px]"
            >
              {copiedSnippet === 'curl' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet === 'curl' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <p className="text-xs text-[#64748B]">
            Invoke the policy evaluation gateway directly over standard HTTP from any programming language or workflow automation tool:
          </p>
          <pre className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-xs text-[#172B4D] overflow-x-auto leading-relaxed">
            {restApiSnippet}
          </pre>
        </section>

        {/* 4. MST Blockchain Connection */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#15803D]" />
              <h3 className="text-sm font-bold text-[#172B4D]">MST Blockchain Smart Contract Connection</h3>
            </div>
            <Link
              href="/blockchain"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>Explore On-Chain Registry</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Network RPC</span>
              <span className="text-[#172B4D] font-bold mt-1 block">https://testnetrpc.mstblockchain.com</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Chain ID</span>
              <span className="text-[#172B4D] font-bold mt-1 block">91562037 (0x5752035)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Verified Contract</span>
              <span className="text-[#2563EB] font-bold mt-1 block truncate">0x0539fc70ee18fa936395c8dd6db623af6b43ceca</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
