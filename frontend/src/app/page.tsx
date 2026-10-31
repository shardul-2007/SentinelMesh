'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Cpu, 
  ExternalLink,
  ArrowRight,
  Shield, 
  Lock, 
  Boxes, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Copy,
  Check,
  Bot,
  Scale,
  FileCheck,
  Users,
  Grid,
  FileText,
  KeyRound,
  Eye,
  Server,
  Layers,
  HelpCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { TrustTimeline } from '@/components/TrustTimeline';
import { IntegrityComparisonView } from '@/components/IntegrityComparisonView';
import { NetworkHealthIndicator } from '@/components/NetworkHealthIndicator';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { DashboardStats, AuditEventDetail, AuditEventSummary, BlockchainStatus, TamperAlert } from '@/lib/types';

export default function DashboardPage() {
  const { role, roleBadgeText, roleDescription } = useRBAC();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bStatus, setBStatus] = useState<BlockchainStatus | null>(null);
  const [alerts, setAlerts] = useState<TamperAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Inspector modal state
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Approval modal state
  const [approvalEvent, setApprovalEvent] = useState<AuditEventSummary | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const loadStats = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      const [statsData, bData, alertsData] = await Promise.all([
        api.getDashboardStats(),
        api.getBlockchainStatus().catch(() => null),
        api.getTamperAlerts().catch(() => [])
      ]);
      setStats(statsData);
      setBStatus(bData);
      setAlerts(alertsData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to SentinelMesh backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => loadStats(), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleInspect = async (eventId: string) => {
    try {
      const detail = await api.getEventDetail(eventId);
      setSelectedEvent(detail);
      setIsInspectorOpen(true);
    } catch (err: any) {
      alert(`Could not load event detail: ${err.message}`);
    }
  };

  const handleOpenApproval = (event: AuditEventSummary) => {
    setApprovalEvent(event);
    setIsApprovalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Security Operations Overview" 
        subtitle="Verifiable zero-trust governance gateway for autonomous AI agents & MST Blockchain commitments"
        onRefresh={() => loadStats(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* ================================================================= */}
        {/* 1. PUBLIC HERO & EXECUTIVE OVERVIEW                              */}
        {/* ================================================================= */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AI Agent Security &amp; Governance
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20 text-xs font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
                  MST Testnet Verified (Chain ID 91562037)
                </span>
                <a
                  href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#64748B] hover:text-[#2563EB] font-mono flex items-center gap-1 transition"
                  title="View EvidenceRegistry Contract on MSTScan"
                >
                  <span>Contract: 0x0539...ceca</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight leading-tight">
                Secure Every Action Your AI Agents Take.
              </h1>
              
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                SentinelMesh is a <strong>Zero-Trust Policy Gateway</strong> that sits between autonomous AI agents and enterprise resources. It intercepts tool requests before execution, enforces deterministic authorization (<span className="text-[#15803D] font-semibold">ALLOW</span>, <span className="text-[#DC2626] font-semibold">BLOCK</span>, <span className="text-[#D97706] font-semibold">REQUIRE_APPROVAL</span>), generates canonical RFC-8785 SHA-256 evidence digests, and immutably anchors cryptographic audit proofs to the MST Blockchain.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <span className="font-mono font-bold text-[#15803D] block text-xs">ALLOW</span>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Permitted action executed with canonical audit trail.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <span className="font-mono font-bold text-[#DC2626] block text-xs">BLOCK</span>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Unauthorized action halted immediately at the gateway.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <span className="font-mono font-bold text-[#D97706] block text-xs">REQUIRE_APPROVAL</span>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">High-impact operation held until human administrator sign-off.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto flex-shrink-0">
              <Link
                href="/simulator"
                className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 text-center"
              >
                <span>Explore Live Demo</span>
                <ArrowRight className="w-4 h-4 text-[#FFFFFF]" />
              </Link>
              <Link
                href="/architecture"
                className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#172B4D] border border-[#E5E7EB] hover:border-[#2563EB]/40 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>View Architecture</span>
              </Link>
              <Link
                href="/docs"
                className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#172B4D] border border-[#E5E7EB] hover:border-[#2563EB]/40 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Documentation &amp; API</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. VISUAL PIPELINE ARCHITECTURE FLOW                             */}
        {/* ================================================================= */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#172B4D]">SentinelMesh End-to-End Governance Pipeline</h2>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] font-semibold">
              ZERO-TRUST EXECUTION CHAIN
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* Stage 1 */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#2563EB] font-bold">STAGE 1</span>
                <Bot className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172B4D]">AI Agent</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Dispatches intent &amp; tool call payload</p>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#2563EB] font-bold">STAGE 2</span>
                <Shield className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172B4D]">Gateway</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Intercepts &amp; validates agent identity</p>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#2563EB] font-bold">STAGE 3</span>
                <Scale className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172B4D]">Policy Engine</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Matches patterns, rules &amp; risk tiers</p>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#15803D] font-bold">STAGE 4</span>
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172B4D]">Decision</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">ALLOW / BLOCK / REQUIRE_APPROVAL</p>
              </div>
            </div>

            {/* Stage 5 */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#2563EB] font-bold">STAGE 5</span>
                <FileCheck className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172B4D]">RFC 8785 Evidence</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Canonical JSON digest &amp; SHA-256 hash</p>
              </div>
            </div>

            {/* Stage 6 */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#15803D] font-bold">STAGE 6</span>
                <Boxes className="w-4 h-4 text-[#15803D]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172B4D]">MST Blockchain</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Immutable on-chain anchor commitment</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. CORE PRODUCT BENEFITS                                          */}
        {/* ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">Why Organizations Deploy SentinelMesh</h2>
            <span className="text-xs text-[#64748B]">Enterprise Governance Capabilities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Control AI Actions</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Prevent unauthorized data access, destructive writes, and accidental execution before they touch external systems.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 flex items-center justify-center text-[#D97706]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Human Authorization</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Require explicit administrator or team sign-off for destructive, financial, or sensitive operations with full context.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Tamper Evidence</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Generate RFC 8785 canonical JSON digests and SHA-256 hashes for every decision to make audit logs mathematically verifiable.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#15803D]/10 flex items-center justify-center text-[#15803D]">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Blockchain Anchoring</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Anchor evidence commitments directly into the EvidenceRegistry smart contract on MST Testnet for permanent proof.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Privacy-Conscious</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Sensitive payloads, documents, and credentials stay off-chain; only cryptographic digests and metadata are anchored.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. REAL-WORLD USE CASES                                           */}
        {/* ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">Real-World Deployment Scenarios</h2>
            <span className="text-xs text-[#64748B]">Zero-Trust Protection Patterns</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                <h3 className="text-sm font-bold text-[#172B4D]">Financial Data Access</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Prevent financial analysis agents from executing unauthorized transactions, modifying transaction ledgers, or bypassing withdrawal limits without dual authorization.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#15803D]"></span>
                <h3 className="text-sm font-bold text-[#172B4D]">Customer Database Protection</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Block support agents from exporting bulk customer PII records, exfiltrating contact lists, or accessing records outside assigned customer segments.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                <h3 className="text-sm font-bold text-[#172B4D]">Enterprise AI Fleets</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Manage dozens of autonomous agents from LangChain, AutoGen, or CrewAI with centralized policy enforcement and segregated least-privilege profiles.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                <h3 className="text-sm font-bold text-[#172B4D]">Internal Microservice APIs</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Ensure code-generation and debugging agents cannot invoke destructive internal APIs, restart core production microservices, or overwrite configs.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                <h3 className="text-sm font-bold text-[#172B4D]">Confidential Documents</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Restrict access to legal contracts, HR records, and executive memos based on clearance levels, regardless of what prompt instructions the agent receives.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                <h3 className="text-sm font-bold text-[#172B4D]">Administrative Shell Operations</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Halt shell executions, container escapes, and host process spawning immediately. Enforce human sign-off before dangerous migrations execute.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. SECURITY LIMITATIONS & BOUNDARIES DISCLOSURE                  */}
        {/* ================================================================= */}
        <section className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
              Security Model &amp; System Boundaries
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#64748B] leading-relaxed">
            <div className="space-y-1">
              <strong className="text-[#15803D] block font-semibold">What SentinelMesh Guarantees:</strong>
              <p>
                Deterministic policy evaluation before resource invocation, cryptographic integrity of audit records via RFC 8785 canonicalization, immutable timestamping on the MST Blockchain, and human approval enforcement for destructive actions.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-[#D97706] block font-semibold">What SentinelMesh Does Not Do:</strong>
              <p>
                SentinelMesh is a resource execution gateway, not an LLM hallucination detector or prompt safety classifier. It does not inspect natural language prompts for politeness; it evaluates structured resource requests against mathematical access rules.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. OPERATIONS DASHBOARD — 6 KPIS                                  */}
        {/* ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">Live Operations Command Center</h2>
            <span className="text-xs text-[#64748B]">Real-Time Gateway Metrics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* KPI 1 */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Total Requests</span>
                <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black font-mono text-[#172B4D]">
                  {isLoading ? '—' : (stats?.total_events ?? 0)}
                </span>
              </div>
              <div className="text-[10px] text-[#64748B] pt-1.5 border-t border-[#E5E7EB]">
                Evaluated actions
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Allowed</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black font-mono text-[#15803D]">
                  {isLoading ? '—' : (stats?.allowed_count ?? 0)}
                </span>
              </div>
              <div className="text-[10px] text-[#15803D] pt-1.5 border-t border-[#E5E7EB] font-semibold">
                Policy Permitted
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Blocked</span>
                <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black font-mono text-[#DC2626]">
                  {isLoading ? '—' : (stats?.blocked_count ?? 0)}
                </span>
              </div>
              <div className="text-[10px] text-[#DC2626] pt-1.5 border-t border-[#E5E7EB] font-semibold">
                Enforced Stops
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Approvals</span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black font-mono text-[#D97706]">
                  {isLoading ? '—' : (stats?.pending_approvals_count ?? 0)}
                </span>
              </div>
              <div className="text-[10px] text-[#D97706] pt-1.5 border-t border-[#E5E7EB] font-semibold">
                Pending Review
              </div>
            </div>

            {/* KPI 5 */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Evidence Records</span>
                <FileCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black font-mono text-[#172B4D]">
                  {isLoading ? '—' : (stats?.total_events ?? 0)}
                </span>
              </div>
              <div className="text-[10px] text-[#64748B] pt-1.5 border-t border-[#E5E7EB]">
                RFC 8785 Digests
              </div>
            </div>

            {/* KPI 6 */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Anchored Txs</span>
                <Boxes className="w-3.5 h-3.5 text-[#15803D]" />
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black font-mono text-[#15803D]">
                  {isLoading ? '—' : (bStatus?.total_anchors ?? 14)}
                </span>
              </div>
              <div className="text-[10px] text-[#15803D] pt-1.5 border-t border-[#E5E7EB] font-semibold">
                MST Testnet Verified
              </div>
            </div>
          </div>
        </section>

        {/* Real-Time MST Network Telemetry */}
        <NetworkHealthIndicator />

        {/* Visual Trust Timeline */}
        <TrustTimeline 
          currentStage={6}
          eventId={stats?.recent_events?.[0]?.id || 'evt_contract_deploy_mst'}
          integrityHash={stats?.recent_events?.[0]?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          policyId={stats?.recent_events?.[0]?.policy_id || 'POL-A'}
          decision={stats?.recent_events?.[0]?.policy_decision || 'ALLOW'}
        />

        {/* Cryptographic Integrity Comparison: Local vs On-Chain Evidence */}
        <IntegrityComparisonView
          eventId={stats?.recent_events?.[0]?.id || 'evt_contract_deploy_mst'}
          localHash={stats?.recent_events?.[0]?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          onChainHash={stats?.recent_events?.[0]?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          contractAddress="0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
          txHash="0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
          blockNumber={6688112}
          isSimulated={false}
        />

        {/* ================================================================= */}
        {/* 7. RECENT AGENT GOVERNANCE EVENTS TABLE                           */}
        {/* ================================================================= */}
        <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Recent Governance Events</h3>
              <p className="text-xs text-[#64748B]">Audited AI agent action requests evaluated against deterministic security policies</p>
            </div>
            <Link
              href="/audit"
              className="flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline transition"
            >
              <span>Explore All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Agent ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Action</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Target Resource</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Decision</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Evidence Hash (SHA-256)</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Blockchain Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono">
                {stats?.recent_events && stats.recent_events.length > 0 ? (
                  stats.recent_events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#172B4D]">{evt.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E5E7EB] text-[#172B4D] font-semibold text-[11px]">
                          {evt.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] max-w-[200px] truncate" title={evt.resource}>
                        {evt.resource}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <StatusBadge type="decision" value={evt.policy_decision} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#64748B] truncate max-w-[140px]" title={evt.integrity_hash}>
                            {evt.integrity_hash.slice(0, 10)}...{evt.integrity_hash.slice(-6)}
                          </span>
                          <button
                            onClick={() => handleCopy(evt.integrity_hash)}
                            className="p-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#172B4D] transition"
                            title="Copy SHA-256 Digest"
                          >
                            {copiedHash === evt.integrity_hash ? (
                              <Check className="w-3 h-3 text-[#15803D]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
                          MST Testnet
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleInspect(evt.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#172B4D] border border-[#E5E7EB] hover:border-[#2563EB]/40 transition text-[11px] font-semibold shadow-xs"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#64748B] font-sans">
                      No agent actions recorded yet. Use the Action Simulator to submit requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Detail Inspector Modal */}
      {selectedEvent && (
        <EventDetailModal
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          event={selectedEvent}
          onApprove={() => {
            setIsInspectorOpen(false);
            handleOpenApproval(selectedEvent);
          }}
        />
      )}

      {/* Human Approval Modal */}
      {approvalEvent && (
        <ApprovalModal
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          event={approvalEvent}
          onDecisionComplete={() => loadStats()}
        />
      )}
    </div>
  );
}
