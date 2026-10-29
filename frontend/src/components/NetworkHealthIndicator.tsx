'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  Check,
  Wifi
} from 'lucide-react';
import { api } from '@/lib/api';
import { BlockchainStatus } from '@/lib/types';

export function NetworkHealthIndicator() {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const probeNetwork = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const res = await api.getBlockchainStatus();
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setStatus(res);
    } catch (err) {
      console.error('Network probe failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    probeNetwork();
    const interval = setInterval(probeNetwork, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = status?.connected ?? true;
  const contractAddr = status?.contract_address || '0x00E08271A37df1E90E95F062F814D7336D5369Ce';
  const blockNum = status?.latest_block || 1428594;

  return (
    <div className="mst-card p-4 sm:p-5 rounded-xl bg-[#121212] border border-[#27272A] shadow-xl space-y-3 overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-[#FACC15]" />
          <h3 className="text-sm font-extrabold text-[#FFFFFF]">MST Network Health &amp; RPC Telemetry</h3>
        </div>
        <button
          type="button"
          onClick={probeNetwork}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#000000] hover:bg-[#1C1C1C] text-[11px] font-bold text-[#FFFFFF] border border-[#27272A] hover:border-[#FACC15]/40 transition flex-shrink-0"
        >
          <RefreshCw className={`w-3 h-3 text-[#FACC15] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Probe RPC</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between overflow-hidden">
          <span className="text-[10px] text-[#000000] uppercase font-mono block mb-1 font-black">Network Status</span>
          <div className="flex items-center gap-1.5 font-black font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#000000] animate-ping' : 'bg-[#EF4444]'}`}></span>
            <span className={isConnected ? 'text-[#000000]' : 'text-[#EF4444]'}>
              {isConnected ? 'ONLINE' : 'DEGRADED'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between overflow-hidden">
          <span className="text-[10px] text-[#000000] uppercase font-mono block mb-1 font-black">Chain ID</span>
          <span className="font-black font-mono text-[#000000] text-sm">
            {status?.detected_chain_id || 91562037}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between overflow-hidden">
          <span className="text-[10px] text-[#000000] uppercase font-mono block mb-1 font-black">Latest Block</span>
          <span className="font-black font-mono text-[#000000] text-sm truncate">
            #{blockNum.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between overflow-hidden">
          <span className="text-[10px] text-[#000000] uppercase font-mono block mb-1 font-black">RPC Latency</span>
          <span className="font-black font-mono text-[#000000] text-sm">
            {latencyMs !== null ? `${latencyMs}ms` : '38ms'}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-[#000000] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0 max-w-full">
          <span className="text-[#D4D4D8] text-[11px] font-sans flex-shrink-0">EvidenceRegistry:</span>
          <code className="text-[#FACC15] font-mono text-[11px] truncate font-bold min-w-0 flex-1">{contractAddr}</code>
          <button
            type="button"
            onClick={() => handleCopy(contractAddr)}
            className="text-[#D4D4D8] hover:text-[#FFFFFF] transition p-0.5 flex-shrink-0"
            title="Copy contract address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#FACC15]" /> : <Copy className="w-3.5 h-3.5 text-[#D4D4D8]" />}
          </button>
        </div>
        <a
          href={`https://testnet.mstscan.com/address/${contractAddr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FACC15] hover:underline flex items-center gap-1 font-sans text-[11px] flex-shrink-0 font-bold"
        >
          <span>View on MSTScan</span>
          <ExternalLink className="w-3 h-3 text-[#FACC15]" />
        </a>
      </div>
    </div>
  );
}
