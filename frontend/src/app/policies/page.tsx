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
  X
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
        version: '1.0',
        is_active: true
      });
      setIsModalOpen(false);
      // Reset form
      setNewId('');
      setNewName('');
      setNewDescription('');
      setActionMsg({ type: 'success', text: `Policy ${newId.toUpperCase()} authored and published to enforcement matrix.` });
      await fetchPolicies();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to create policy.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Policy Studio" 
        subtitle="Deterministic rule matrix evaluated by the SentinelMesh policy enforcement gateway"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance & Authority Bar */}
        <div className="p-4 rounded-xl bg-[#131A24]/90 border border-[#263244] shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
              role === 'ADMIN' 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : role === 'SECURITY_ANALYST'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Active Authority:</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#64748B] hidden lg:inline">| {roleDescription}</span>
              </div>
              <p className="text-xs text-[#CBD5E1] mt-0.5">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author Policy</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B0F17] border border-[#263244] text-[11px] text-[#94A3B8] font-mono">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Authoring Restricted (CSO Only)</span>
              </div>
            )}
            <button
              type="button"
              onClick={fetchPolicies}
              title="Refresh policy matrix"
              className="p-2 rounded-lg bg-[#0B0F17] border border-[#263244] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-cyan-500/40 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {actionMsg && (
          <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {actionMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{actionMsg.text}</span>
            </div>
            <button type="button" onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Architecture Notice */}
        <div className="p-4 rounded-xl bg-[#131A24] border border-[#263244] flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] flex-shrink-0 mt-0.5">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              Deterministic Policy Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                ACTIVE ENGINE
              </span>
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-3xl">
              Every agent request is evaluated against this server-side rule matrix with explicit precedence. Blocked and approval-required operations are immediately halted before touching target resources.
            </p>
          </div>
        </div>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 py-12 text-center text-[#94A3B8] text-xs font-sans">
              Loading active policies from backend...
            </div>
          ) : policies.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-[#94A3B8] text-xs font-sans">
              No policies registered in the database.
            </div>
          ) : (
            policies.map((policy) => {
              const isActive = policy.is_active !== false;
              return (
                <div 
                  key={policy.id}
                  className={`p-5 rounded-xl bg-[#131A24] border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm ${
                    isActive 
                      ? 'border-[#263244] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]' 
                      : 'border-red-500/20 opacity-60 bg-[#0B0F17]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#0B0F17] text-[#38BDF8] font-mono text-xs font-bold border border-[#263244]">
                          {policy.id}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">v{policy.version || '1.0'}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          isActive 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {isActive ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <StatusBadge type="decision" value={policy.decision} size="sm" />
                    </div>

                    <h4 className="text-sm font-semibold text-[#F8FAFC] mb-1">{policy.name}</h4>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{policy.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#263244] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8] text-[11px]">Action Pattern:</span>
                      <span className="font-mono text-[#F8FAFC] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#263244]">
                        {policy.action_pattern}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8] text-[11px]">Resource Scope:</span>
                      <span className="font-mono text-[#F8FAFC] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#263244] max-w-[220px] truncate" title={policy.resource_pattern}>
                        {policy.resource_pattern}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#94A3B8] text-[11px]">Derived Server Risk:</span>
                      <StatusBadge type="risk" value={policy.risk_tier} size="sm" />
                    </div>

                    {/* CSO Control Action */}
                    <div className="pt-2 border-t border-[#263244] flex items-center justify-between">
                      {permissions.canManagePolicies ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(policy.id)}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded transition border ${
                            isActive
                              ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isActive ? 'Deactivate Policy' : 'Activate Policy'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-[#64748B] flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Admin Protected</span>
                        </span>
                      )}
                      <span className="text-[10px] text-[#64748B] font-mono">Zero-Trust Precedence</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B0F17] border border-[#263244] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263244]">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Author New Security Policy</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Policy Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POL-G"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Enforced Decision
                  </label>
                  <select
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value as PolicyDecision)}
                    className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="ALLOW">ALLOW (Execute)</option>
                    <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Gate)</option>
                    <option value="BLOCK">BLOCK (Halt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guard Kubernetes Production Pods"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Policy Rationale / Description
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Specify threat scenario and reason for enforcement rule..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Action Pattern
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DELETE or READ"
                    value={newActionPattern}
                    onChange={(e) => setNewActionPattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Risk Tier
                  </label>
                  <select
                    value={newRiskTier}
                    onChange={(e) => setNewRiskTier(e.target.value as RiskTier)}
                    className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Resource URI Pattern
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. k8s://prod/* or db://users/*"
                  value={newResourcePattern}
                  onChange={(e) => setNewResourcePattern(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#131A24] border border-[#263244] text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#263244]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-[#131A24] border border-[#263244] hover:bg-[#1A2332] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:from-emerald-400 hover:to-cyan-400 transition disabled:opacity-50"
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
