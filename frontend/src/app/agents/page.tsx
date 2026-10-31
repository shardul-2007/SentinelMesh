'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  Lock,
  ArrowRight,
  Sliders,
  Activity,
  Cpu
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useRBAC } from '@/lib/rbac';

interface AgentRecord {
  id: string;
  name: string;
  framework: 'LangChain' | 'AutoGen' | 'CrewAI' | 'Custom';
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  policyProfile: string;
  status: 'ACTIVE' | 'QUARANTINED';
  totalActions: number;
  lastActive: string;
  description: string;
}

const INITIAL_AGENTS: AgentRecord[] = [
  {
    id: 'agent-data-analyzer',
    name: 'Compliance Analytics Bot',
    framework: 'LangChain',
    riskProfile: 'LOW',
    policyProfile: 'POL-A, POL-C (Analytics & Reads)',
    status: 'ACTIVE',
    totalActions: 42,
    lastActive: '2 mins ago',
    description: 'Processes operational logs and aggregates quarterly compliance reports.'
  },
  {
    id: 'agent-financial-bot',
    name: 'Treasury & Ledger Bot',
    framework: 'CrewAI',
    riskProfile: 'HIGH',
    policyProfile: 'POL-D, POL-E (Ledger & PII Guards)',
    status: 'ACTIVE',
    totalActions: 18,
    lastActive: '14 mins ago',
    description: 'Automates customer billing rollups and reconciles ledger balances.'
  },
  {
    id: 'agent-devops-orchestrator',
    name: 'Cluster DevOps Orchestrator',
    framework: 'AutoGen',
    riskProfile: 'CRITICAL',
    policyProfile: 'POL-F (Strict Command Isolation)',
    status: 'ACTIVE',
    totalActions: 29,
    lastActive: '1 hour ago',
    description: 'Manages Kubernetes pod scaling and executes CI/CD container workloads.'
  },
  {
    id: 'agent-guest',
    name: 'Unverified External Ingestion Bot',
    framework: 'Custom',
    riskProfile: 'CRITICAL',
    policyProfile: 'POL-B (Default Zero-Trust Block)',
    status: 'QUARANTINED',
    totalActions: 6,
    lastActive: '3 hours ago',
    description: 'External sandbox agent flagged for attempting unauthorized production vault access.'
  }
];

export default function AgentsPage() {
  const { role, permissions, roleBadgeText } = useRBAC();
  const [agents, setAgents] = useState<AgentRecord[]>(INITIAL_AGENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New agent form
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newFramework, setNewFramework] = useState<'LangChain' | 'AutoGen' | 'CrewAI' | 'Custom'>('LangChain');
  const [newRisk, setNewRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [newDesc, setNewDesc] = useState('');

  const toggleQuarantine = (agentId: string) => {
    if (!permissions.canManagePolicies) {
      setNotification('Action restricted: Only CSO (Admin) can modify agent quarantine state.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const nextStatus = a.status === 'ACTIVE' ? 'QUARANTINED' : 'ACTIVE';
        setNotification(`Agent ${a.id} status changed to ${nextStatus}.`);
        setTimeout(() => setNotification(null), 3000);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleRegisterAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManagePolicies) {
      setNotification('Action restricted: Only CSO (Admin) can register new agents.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const newRecord: AgentRecord = {
      id: newId || `agent-${Date.now().toString(36)}`,
      name: newName || 'Enterprise Worker Bot',
      framework: newFramework,
      riskProfile: newRisk,
      policyProfile: 'POL-A (Standard Baseline)',
      status: 'ACTIVE',
      totalActions: 0,
      lastActive: 'Just now',
      description: newDesc || 'Provisioned autonomous agent under SentinelMesh zero-trust gateway.'
    };
    setAgents([newRecord, ...agents]);
    setIsModalOpen(false);
    setNewId('');
    setNewName('');
    setNewDesc('');
    setNotification(`Agent ${newRecord.id} successfully registered.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.framework.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = agents.filter(a => a.status === 'ACTIVE').length;
  const quarantinedCount = agents.filter(a => a.status === 'QUARANTINED').length;

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Agent Fleet Management" 
        subtitle="Zero-trust access registry, runtime status toggles &amp; authorization profiles for AI agents"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {notification && (
          <div className="p-3.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-xs hover:underline">Dismiss</button>
          </div>
        )}

        {/* Fleet KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Total Agents</span>
              <Users className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-3xl font-black font-mono text-[#172B4D] mt-2">
              {agents.length}
            </div>
            <div className="text-[10px] text-[#64748B] pt-2 border-t border-[#E5E7EB]">
              Registered in Gateway
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Active Fleets</span>
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            </div>
            <div className="text-3xl font-black font-mono text-[#15803D] mt-2">
              {activeCount}
            </div>
            <div className="text-[10px] text-[#15803D] pt-2 border-t border-[#E5E7EB] font-semibold">
              Authorized for dispatch
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Quarantined</span>
              <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-3xl font-black font-mono text-[#DC2626] mt-2">
              {quarantinedCount}
            </div>
            <div className="text-[10px] text-[#DC2626] pt-2 border-t border-[#E5E7EB] font-semibold">
              Execution halted
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Frameworks</span>
              <Cpu className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-3xl font-black font-mono text-[#172B4D] mt-2">
              4
            </div>
            <div className="text-[10px] text-[#64748B] pt-2 border-t border-[#E5E7EB]">
              LangChain, AutoGen, CrewAI, Custom
            </div>
          </div>
        </div>

        {/* Filter and Register Bar */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by agent name, ID, or framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-[#172B4D] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Agent</span>
          </button>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id}
              className={`p-5 rounded-2xl bg-[#FFFFFF] border transition shadow-xs space-y-4 ${
                agent.status === 'QUARANTINED' ? 'border-[#DC2626]/40 bg-[#FEF2F2]/20' : 'border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    agent.status === 'QUARANTINED' 
                      ? 'bg-[#DC2626]/10 text-[#DC2626]' 
                      : 'bg-[#2563EB]/10 text-[#2563EB]'
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172B4D]">{agent.name}</h3>
                    <p className="font-mono text-xs text-[#64748B]">{agent.id}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  agent.status === 'ACTIVE'
                    ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20'
                    : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ACTIVE' ? 'bg-[#15803D]' : 'bg-[#DC2626]'}`}></span>
                  {agent.status}
                </span>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed">
                {agent.description}
              </p>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#E5E7EB] text-[11px] font-mono">
                <div>
                  <span className="text-[#64748B] block text-[10px]">Framework</span>
                  <span className="font-semibold text-[#172B4D]">{agent.framework}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">Risk Tier</span>
                  <span className={`font-semibold ${
                    agent.riskProfile === 'CRITICAL' ? 'text-[#DC2626]' :
                    agent.riskProfile === 'HIGH' ? 'text-[#D97706]' : 'text-[#15803D]'
                  }`}>
                    {agent.riskProfile}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">Total Actions</span>
                  <span className="font-semibold text-[#172B4D]">{agent.totalActions}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#64748B]">Active {agent.lastActive}</span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/simulator?agent=${agent.id}`}
                    className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172B4D] border border-[#E5E7EB] text-xs font-semibold transition"
                  >
                    Test In Gateway
                  </Link>
                  <button
                    onClick={() => toggleQuarantine(agent.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      agent.status === 'ACTIVE'
                        ? 'bg-[#FFFFFF] hover:bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30'
                        : 'bg-[#15803D] hover:bg-[#166534] text-[#FFFFFF] border-transparent'
                    }`}
                  >
                    {agent.status === 'ACTIVE' ? 'Quarantine' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090D16]/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#172B4D]">Register Autonomous Agent</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#172B4D] text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#172B4D] font-bold mb-1">Agent Identifier (Unique slug)</label>
                <input
                  type="text"
                  required
                  placeholder="agent-customer-support-01"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] font-mono focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#172B4D] font-bold mb-1">Human-Readable Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="Customer Support Triage Bot"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172B4D] font-bold mb-1">Agent Framework</label>
                  <select
                    value={newFramework}
                    onChange={(e: any) => setNewFramework(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] focus:bg-[#FFFFFF]"
                  >
                    <option value="LangChain">LangChain</option>
                    <option value="AutoGen">AutoGen</option>
                    <option value="CrewAI">CrewAI</option>
                    <option value="Custom">Custom LLM Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172B4D] font-bold mb-1">Risk Ceiling</label>
                  <select
                    value={newRisk}
                    onChange={(e: any) => setNewRisk(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] focus:bg-[#FFFFFF]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#172B4D] font-bold mb-1">Operational Role &amp; Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describes the permitted tools, resources, and functional scope of this autonomous agent."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172B4D] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold transition shadow-xs"
                >
                  Save &amp; Activate Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
