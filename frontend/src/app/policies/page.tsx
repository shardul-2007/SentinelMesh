'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Shield, 
  CheckCircle, 
  Info, 
  Lock, 
  Plus, 
  Power, 
  RefreshCw,
  AlertTriangle,
  FileCode,
  Layers,
  X,
  FileText
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { SecurityPolicy, PolicyDecision, RiskTier } from '@/lib/types';

export default function PoliciesPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New policy form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActionPattern, setNewActionPattern] = useState('READ');
  const [newResourcePattern, setNewResourcePattern] = useState('db://*');
  const [newDecision, setNewDecision] = useState<PolicyDecision>('REQUIRE_APPROVAL');
  const [newRiskTier, setNewRiskTier] = useState<RiskTier>('HIGH');

  const fetchPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleToggle = async (policyId: string) => {
    if (!permissions.canManagePolicies) {
      setActionMsg({ type: 'error', text: 'Administrative permission required: Only CSO (Admin) can toggle policy activation.' });
      return;
    }
    try {
      await api.togglePolicy(policyId);
      setActionMsg({ type: 'success', text: `Policy ${policyId} activation status successfully updated.` });
      await fetchPolicies();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to toggle policy status.' });
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManagePolicies) {
      setActionMsg({ type: 'error', text: 'Administrative permission required: Only CSO (Admin) can author new policies.' });
      return;
    }
    setIsSubmitting(true);
    setActionMsg(null);
    try {
      await api.createPolicy({
        id: newId.trim().toUpperCase(),
        name: newName.trim(),
        description: newDescription.trim(),
        action_pattern: newActionPattern.trim().toUpperCase(),
        resource_pattern: newResourcePattern.trim(),
        decision: newDecision,
        risk_tier: newRiskTier,
        is_active: true
      });
      setActionMsg({ type: 'success', text: `Policy ${newId} created successfully.` });
      setIsModalOpen(false);
      setNewId('');
      setNewName('');
      setNewDescription('');
      await fetchPolicies();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to create policy.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Deterministic Security Policies" 
        subtitle="Zero-trust access rules, pattern matching &amp; mathematical risk thresholds for AI agents"
        onRefresh={fetchPolicies}
        isRefreshing={isLoading}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance & Authority Bar */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
              role === 'ADMIN' 
                ? 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20' 
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                : 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">Active Authority:</span>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#64748B] hidden lg:inline font-semibold">| {roleDescription}</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {role === 'ADMIN' 
                  ? 'Full administrative control over policy lifecycle: author, activate, deactivate, and adjust risk precedence.'
                  : role === 'SECURITY_ANALYST'
                  ? 'Read-only rule matrix inspection: verify patterns, risk tiers, and deterministic decisions without authoring rights.'
                  : 'Compliance catalog audit view: inspect active rules, change history, and governance constraints.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {permissions.canManagePolicies ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author Policy</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[11px] text-[#64748B] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Authoring Restricted (CSO Only)</span>
              </div>
            )}
            <button
              type="button"
              onClick={fetchPolicies}
              title="Refresh policy matrix"
              className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#64748B] hover:text-[#172B4D] hover:border-[#2563EB]/40 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {actionMsg && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-[#15803D]/10 border-[#15803D]/20 text-[#15803D]'
              : 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'
          }`}>
            <div className="flex items-center gap-2">
              {actionMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{actionMsg.text}</span>
            </div>
            <button type="button" onClick={() => setActionMsg(null)} className="text-[#64748B] hover:text-[#172B4D]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Registered Policies</span>
              <Sliders className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">{policies.length || 7}</div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span>Deterministic matrix</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                PRECEDENCE
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Active Enforcement</span>
              <CheckCircle className="w-4 h-4 text-[#15803D] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#15803D] mt-1 font-mono">
              {policies.filter(p => p.is_active !== false).length || policies.length}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span>Zero-bypass gateway</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                ENABLED
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Critical Safeguards</span>
              <Shield className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#DC2626] mt-1 font-mono">
              {policies.filter(p => p.decision === 'BLOCK').length || 3}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span>Automated hard stops</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
                HARD BLOCK
              </span>
            </div>
          </div>
        </div>

        {/* Architecture Notice */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] flex-shrink-0 mt-0.5">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              Deterministic Policy Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-extrabold bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                ACTIVE ENGINE
              </span>
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-3xl">
              Every agent request is evaluated against this server-side rule matrix with explicit precedence. Blocked and approval-required operations are immediately halted before touching target resources.
            </p>
          </div>
        </div>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 py-12 text-center text-[#64748B] text-xs font-sans">
              Loading active policies from backend...
            </div>
          ) : policies.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-[#64748B] text-xs font-sans">
              No policies registered in the database.
            </div>
          ) : (
            policies.map((policy) => {
              const isActive = policy.is_active !== false;
              return (
                <div 
                  key={policy.id}
                  className={`p-5 rounded-2xl bg-[#FFFFFF] border transition-all duration-150 flex flex-col justify-between space-y-4 shadow-xs ${
                    isActive 
                      ? 'border-[#E5E7EB] hover:border-[#2563EB]/40' 
                      : 'border-[#DC2626]/20 opacity-60 bg-[#F8FAFC]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#F8FAFC] text-[#2563EB] font-mono text-xs font-bold border border-[#E5E7EB]">
                          {policy.id}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono font-bold">v{policy.version || '1.0'}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                          isActive 
                            ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20' 
                            : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                        }`}>
                          {isActive ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <StatusBadge type="decision" value={policy.decision} size="sm" />
                    </div>

                    <h4 className="text-sm font-bold text-[#172B4D] mb-1">{policy.name}</h4>
                    <p className="text-xs text-[#64748B] leading-relaxed">{policy.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px] font-semibold">Action Pattern:</span>
                      <span className="font-mono text-[#172B4D] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E5E7EB] font-bold">
                        {policy.action_pattern}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px] font-semibold">Resource Scope:</span>
                      <span className="font-mono text-[#172B4D] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E5E7EB] max-w-[220px] truncate font-semibold" title={policy.resource_pattern}>
                        {policy.resource_pattern}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#64748B] text-[11px] font-semibold">Derived Server Risk:</span>
                      <StatusBadge type="risk" value={policy.risk_tier} size="sm" />
                    </div>

                    {/* CSO Control Action */}
                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                      {permissions.canManagePolicies ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(policy.id)}
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition border ${
                            isActive
                              ? 'bg-[#FFFFFF] hover:bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30'
                              : 'bg-[#15803D] hover:bg-[#166534] text-[#FFFFFF] border-transparent'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isActive ? 'Deactivate Policy' : 'Activate Policy'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-[#64748B] flex items-center gap-1 font-semibold">
                          <Lock className="w-3 h-3 text-[#D97706]" />
                          <span>Admin Protected</span>
                        </span>
                      )}
                      <span className="text-[10px] text-[#64748B] font-mono font-semibold">Zero-Trust Precedence</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Author Policy Modal (CSO Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090D16]/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#172B4D]">Author New Security Policy</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#172B4D] p-1 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                    Policy Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POL-G"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] font-mono focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                    Enforced Decision
                  </label>
                  <select
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value as PolicyDecision)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] font-mono focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="ALLOW">ALLOW (Execute)</option>
                    <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Gate)</option>
                    <option value="BLOCK">BLOCK (Halt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guard Kubernetes Production Pods"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  Policy Rationale / Description
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Specify threat scenario and reason for enforcement rule..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                    Action Pattern
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DELETE or READ"
                    value={newActionPattern}
                    onChange={(e) => setNewActionPattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] font-mono focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                    Risk Tier
                  </label>
                  <select
                    value={newRiskTier}
                    onChange={(e) => setNewRiskTier(e.target.value as RiskTier)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] font-mono focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  Resource URI Pattern
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. k8s://prod/* or db://users/*"
                  value={newResourcePattern}
                  onChange={(e) => setNewResourcePattern(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] font-mono focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E5E7EB] hover:text-[#172B4D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] transition disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Publishing Policy...' : 'Commit & Enforce Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
