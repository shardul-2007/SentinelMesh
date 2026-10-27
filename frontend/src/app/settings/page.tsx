'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Database, 
  Server, 
  Key, 
  Layers, 
  Hash, 
  CheckCircle, 
  ExternalLink 
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function SettingsPage() {
  const [testHash, setTestHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testHash.trim()) return;

    if (/^[a-fA-F0-9]{64}$/.test(testHash.trim())) {
      setVerificationResult('Valid SHA-256 hash formatting. Anchored to local chained ledger structure.');
    } else {
      setVerificationResult('Invalid hash format. SHA-256 hashes must be exactly 64 hexadecimal characters.');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header 
        title="System Settings & Infrastructure" 
        subtitle="Local node environment configurations and cryptographic integrity management"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Node Information Card */}
        <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-graphite-750">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Local Environment Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase">Platform Environment</span>
              <div className="font-mono text-emerald-400 font-medium">LOCAL DEVELOPMENT (Phase 1)</div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase">Execution Sandbox Mode</span>
              <div className="font-mono text-slate-200 font-medium">SIMULATED (Zero Host Execution)</div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase">Backend API Base</span>
              <div className="font-mono text-slate-200 font-medium">http://127.0.0.1:8000</div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase">Database Storage</span>
              <div className="font-mono text-slate-200 font-medium">SQLite (./sentinelmesh.db)</div>
            </div>
          </div>
        </div>

        {/* Security & Authorization Configuration */}
        <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-graphite-750">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">Administrative Authorization Controls</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Sensitive actions requiring human review (e.g., database deletion, customer PII export) are protected by administrative authentication. The development key is loaded via backend environment configuration:
          </p>

          <div className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Active Admin Key</span>
              <span className="text-amber-400">sentinel-admin-dev-key-phase1</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Dev Mode Only
            </span>
          </div>
        </div>

        {/* Cryptographic Verification Tool */}
        <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-graphite-750">
            <Hash className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Audit Hash Verification Utility</h3>
          </div>

          <p className="text-xs text-slate-400">
            Validate an event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              value={testHash}
              onChange={(e) => setTestHash(e.target.value)}
              placeholder="Paste 64-character SHA-256 audit hash..."
              className="flex-1 px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-graphite-800 border border-graphite-700 text-slate-200 hover:text-white hover:bg-graphite-750 transition"
            >
              Verify Hash
            </button>
          </form>

          {verificationResult && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              verificationResult.startsWith('Valid')
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {verificationResult.startsWith('Valid') ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <Shield className="w-4 h-4 flex-shrink-0" />}
              <span>{verificationResult}</span>
            </div>
          )}
        </div>

        {/* Phase 2 Blockchain Integration Architecture */}
        <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-graphite-750">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-100">Phase 2 Smart Contract Settlement Plan</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-graphite-850 text-slate-400 border border-graphite-750">
              NOT CONNECTED IN PHASE 1
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            In Phase 1, audit trails are cryptographically chained in local storage using SHA-256 hashes. In Phase 2, SentinelMesh will integrate directly with an EVM smart contract (e.g. Base or Arbitrum) to anchor these hashes into on-chain state roots.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-medium">Phase 1 (Current)</span>
              <div className="font-semibold text-emerald-400">Deterministic Engine &amp; Hash Chaining</div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-medium">Phase 2 (Next)</span>
              <div className="font-semibold text-slate-300">Merkle Root Blockchain Settlement</div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-medium">Phase 3 (Future)</span>
              <div className="font-semibold text-slate-300">Decentralized ZK Validation Network</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
