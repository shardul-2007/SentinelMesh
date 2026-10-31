'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Lock, 
  SlidersHorizontal,
  DollarSign,
  Send,
  Building2,
  FileCode
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function PayPalGovernancePage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Form State
  const [agentId, setAgentId] = useState('agent-financial-bot');
  const [recipient, setRecipient] = useState('cloud-infrastructure@sandbox.paypal.com');
  const [amount, setAmount] = useState<number>(25.00);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('Automated monthly cloud infrastructure payment');

  // Evaluation Result
  const [result, setResult] = useState<any>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paypal/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error('Failed to load PayPal status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleApplyPreset = (preset: { agent: string; recipient: string; amount: number; desc: string }) => {
    setAgentId(preset.agent);
    setRecipient(preset.recipient);
    setAmount(preset.amount);
    setDescription(preset.desc);
    setResult(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setResult(null);

    try {
      const res = await fetch('/api/paypal/governed-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          recipient,
          amount,
          currency,
          description
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        decision: 'BLOCK',
        policy_id: 'SYSTEM_ERROR',
        reason: err.message || 'Failed to submit payment request to SentinelMesh gateway.'
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                <CreditCard className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                PayPal Developer Sandbox Governance
              </h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1 max-w-3xl">
              Zero-Trust policy enforcement for autonomous financial actions. Evaluates payment amounts, verifies agent grants, generates RFC 8785 canonical evidence, and holds high-value transfers for human approval before PayPal Sandbox API execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#172033] hover:bg-[#F7F8FA] transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Diagnostics
            </button>
            <a
              href="https://developer.paypal.com/dashboard/applications/sandbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-[#FFFFFF] rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition shadow-sm"
            >
              PayPal Developer Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Diagnostics Card */}
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Sandbox Environment</p>
              <p className="text-sm font-bold text-[#172033] mt-1">api-m.sandbox.paypal.com</p>
              <p className="text-xs text-[#15803D] font-medium mt-0.5">Free Developer Sandbox</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Gateway Policy Mode</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                <p className="text-sm font-bold text-[#172033]">Zero-Trust Deterministic</p>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Threshold: $100.00 Max Auto</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Credential Status</p>
              <p className="text-sm font-bold text-[#172033] mt-1">
                {statusData?.is_configured ? 'Active Sandbox Credentials' : 'Configuration Required (Optional)'}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {statusData?.is_configured ? statusData.client_id_preview : 'Governed simulation enabled'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Supported Currencies</p>
              <p className="text-sm font-bold text-[#172033] mt-1">USD, EUR, GBP, CAD, AUD</p>
              <p className="text-xs text-[#64748B] mt-0.5">Zero Real Money (Test Tokens)</p>
            </div>
          </div>
        </div>

        {/* Main Grid: Form on Left, Presets & Results on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Payment Request Form */}
          <div className="lg:col-span-7 bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">Submit Governed Payment Action</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Simulate an autonomous AI agent requesting a financial payment through SentinelMesh.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#172033] uppercase tracking-wider">One-Click Test Presets:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset({
                    agent: 'agent-financial-bot',
                    recipient: 'cloud-infrastructure@sandbox.paypal.com',
                    amount: 25.00,
                    desc: 'Autonomous micro-payment for cloud hosting'
                  })}
                  className="text-left p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#2563EB] bg-[#F7F8FA] hover:bg-[#FFFFFF] transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#15803D]">
                    <span>ALLOW</span>
                    <span>$25.00</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">Micro-Payment</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset({
                    agent: 'agent-financial-bot',
                    recipient: 'enterprise-hardware@sandbox.paypal.com',
                    amount: 1500.00,
                    desc: 'High-value data center server acquisition'
                  })}
                  className="text-left p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#D97706] bg-[#F7F8FA] hover:bg-[#FFFFFF] transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#D97706]">
                    <span>APPROVAL</span>
                    <span>$1,500.00</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">High-Value Transfer</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset({
                    agent: 'agent-guest',
                    recipient: 'sanctioned_entity',
                    amount: 50.00,
                    desc: 'Prohibited transfer to untrusted party'
                  })}
                  className="text-left p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DC2626] bg-[#F7F8FA] hover:bg-[#FFFFFF] transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#DC2626]">
                    <span>BLOCK</span>
                    <span>$50.00</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">Sanctioned Entity</p>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                  Requesting AI Agent ID
                </label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="agent-financial-bot">agent-financial-bot (Tier: High, Grant: payment:create)</option>
                  <option value="agent-data-analyzer">agent-data-analyzer (Tier: Low, Read-only)</option>
                  <option value="agent-devops-orchestrator">agent-devops-orchestrator (Tier: Medium)</option>
                  <option value="agent-guest">agent-guest (Unverified / Probation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                  Recipient Merchant / Account
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. merchant@sandbox.paypal.com"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#64748B] text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                    Currency Code
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                  Payment Purpose / Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Automated cloud hosting payment"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Evaluating Through Policy Engine...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Evaluate & Execute Governed Order
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Decision & Verification Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#172033] mb-4">Governance Decision</h2>

              {!result ? (
                <div className="py-12 text-center text-[#64748B]">
                  <ShieldCheck className="w-10 h-10 mx-auto text-[#64748B]/40 mb-3" />
                  <p className="text-sm font-semibold text-[#172033]">Awaiting Action Evaluation</p>
                  <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
                    Select a preset or enter payment parameters to see SentinelMesh evaluate policies in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Decision Badge */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    result.decision === 'ALLOW' 
                      ? 'bg-[#15803D]/10 border-[#15803D]/20 text-[#15803D]' 
                      : result.decision === 'REQUIRE_APPROVAL'
                      ? 'bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]'
                      : 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'
                  }`}>
                    {result.decision === 'ALLOW' ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : result.decision === 'REQUIRE_APPROVAL' ? (
                      <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-wide">
                          {result.decision}
                        </span>
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFFFFF]/80 border">
                          {result.policy_id}
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">
                        {result.reason}
                      </p>
                    </div>
                  </div>

                  {/* PayPal Sandbox Status */}
                  <div className="p-3.5 bg-[#F7F8FA] rounded-lg border border-[#E5E7EB] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#64748B]">PayPal Status:</span>
                      <span className="font-mono font-bold text-[#172033]">{result.paypal_status}</span>
                    </div>
                    {result.event_id && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#64748B]">Audit Event ID:</span>
                        <span className="font-mono text-[#2563EB]">{result.event_id}</span>
                      </div>
                    )}
                    {result.instruction && (
                      <p className="text-[11px] text-[#D97706] font-medium pt-1">
                        {result.instruction}
                      </p>
                    )}
                  </div>

                  {/* SHA-256 Digest */}
                  {result.sha256_digest && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#172033]">RFC 8785 SHA-256 Digest:</span>
                        <button
                          onClick={() => handleCopy(result.sha256_digest)}
                          className="inline-flex items-center gap-1 text-[#2563EB] hover:underline text-[11px] font-semibold"
                        >
                          {copiedHash ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                          {copiedHash ? 'Copied' : 'Copy Hash'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg font-mono text-[11px] text-[#172033] break-all select-all">
                        {result.sha256_digest}
                      </div>
                    </div>
                  )}

                  {/* Action Link */}
                  <div className="pt-2">
                    {result.decision === 'REQUIRE_APPROVAL' ? (
                      <Link
                        href="/approvals"
                        className="w-full py-2 px-3 bg-[#D97706] text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-[#B45309] transition flex items-center justify-center gap-1.5"
                      >
                        Review in Approval Center
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/audit"
                        className="w-full py-2 px-3 bg-[#172033] text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-[#0F172A] transition flex items-center justify-center gap-1.5"
                      >
                        Inspect in Audit Explorer
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Architecture Explainer */}
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                Zero-Trust Financial Governance Pipeline
              </h3>
              <ol className="text-xs text-[#64748B] space-y-2 list-decimal list-inside leading-relaxed">
                <li><strong className="text-[#172033]">Pre-Execution Interception:</strong> AI agent payment requests are intercepted before calling PayPal APIs.</li>
                <li><strong className="text-[#172033]">Deterministic Policy Evaluation:</strong> Evaluated against server-side policies with immutable rules.</li>
                <li><strong className="text-[#172033]">Cryptographic Evidence:</strong> Serialized via RFC 8785 canonical JSON and hashed via SHA-256.</li>
                <li><strong className="text-[#172033]">Human Sign-Off:</strong> High-risk or high-value transfers are safely isolated until approved.</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
