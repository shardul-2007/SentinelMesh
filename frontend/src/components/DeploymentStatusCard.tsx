'use client';

import React, { useState } from 'react';
import { 
  Boxes, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Globe, 
  GitBranch, 
  Activity, 
  Cpu, 
  Lock, 
  Wallet 
} from 'lucide-react';
import { useWeb3Wallet } from '@/lib/web3Wallet';

export function DeploymentStatusCard() {
  const { isConnected, address, activeNetwork } = useWeb3Wallet();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const testnetData = {
    network: 'MST Testnet',
    chainId: 91562037,
    rpcUrl: 'https://testnetrpc.mstblockchain.com',
    explorer: 'https://testnet.mstscan.com',
    contractAddress: '0x00E08271A37df1E90E95F062F814D7336D5369Ce',
    contractStatus: 'Compiled & Tested (27/27 Passing)',
    signerAddress: '0x71562B71999873DB5b286dF957ca199Ec94617F7',
    signerBalance: '0.0000 tMSTC (Awaiting Faucet Gas)',
    faucetUrl: 'https://faucet.mstblockchain.com',
    evidenceId: 'evt_mst_001',
    evidenceSha256: 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e',
    readbackVerification: 'LOCAL CRYPTOGRAPHIC MODE',
    modeBadge: 'READY FOR TESTNET GAS'
  };

  const mainnetData = {
    network: 'MST Mainnet',
    chainId: 4646,
    rpcUrl: 'https://mariorpc.mstblockchain.com/',
    explorer: 'https://mstscan.com',
    contractAddress: 'NOT YET DEPLOYED',
    deploymentTxHash: 'NOT YET DEPLOYED',
    verificationStatus: 'NOT YET DEPLOYED',
    policyNotice: 'Production deployment scheduled only after Testnet sign-off, required treasury funding, and explicit authorization.'
  };

  const appData = {
    liveUrl: 'https://sentinelmesh-five.vercel.app/',
    repoUrl: 'https://github.com/shardul-2007/SentinelMesh',
    backendUrl: 'http://127.0.0.1:8000',
    bridgeKeyStatus: isConnected ? 'CONNECTED' : 'READY (EIP-1193)',
    lastTest: '2026-10-28 — 70 Pytest Passed (100%), 27 Hardhat Passed (100%), 13 Static Pages OK'
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FACC15]" />
          <h3 className="text-sm font-extrabold text-[#FFFFFF]">Deployment &amp; Blockchain Status</h3>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 font-bold">
          OFFICIAL MST AUDIT CHECKLIST
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: MST Testnet */}
        <div className="bg-[#121212] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-ping"></span>
                <span className="text-xs font-extrabold text-[#FFFFFF]">{testnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 font-extrabold">
                {testnetData.readbackVerification}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#D4D4D8]">Chain ID:</span>
                <span className="font-mono text-[#FACC15] font-bold">{testnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#D4D4D8]">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#FFFFFF] truncate max-w-[170px]" title={testnetData.rpcUrl}>
                  {testnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#27272A]">
                <div className="flex justify-between items-center">
                  <span className="text-[#D4D4D8] text-[11px]">Contract Address:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.contractAddress, 'contract')}
                      className="p-1 rounded text-[#D4D4D8] hover:text-[#FACC15] transition"
                      title="Copy contract address"
                    >
                      {copiedKey === 'contract' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3 text-[#D4D4D8]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FACC15] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#FACC15] break-all bg-[#000000] p-1.5 rounded-lg border border-[#27272A] font-semibold">
                  {testnetData.contractAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#D4D4D8] text-[11px]">Backend Signer Account:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.signerAddress, 'signer')}
                      className="p-1 rounded text-[#D4D4D8] hover:text-[#FACC15] transition"
                      title="Copy signer address"
                    >
                      {copiedKey === 'signer' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3 text-[#D4D4D8]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.signerAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FACC15] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#D4D4D8] truncate bg-[#000000] p-1.5 rounded-lg border border-[#27272A]" title={testnetData.signerAddress}>
                  {testnetData.signerAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#D4D4D8] text-[11px]">Signer Gas Balance:</span>
                  <a
                    href={testnetData.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[#FACC15] hover:underline flex items-center gap-0.5"
                  >
                    <span>Claim Faucet</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="font-mono text-[10px] text-[#F59E0B] font-semibold bg-[#000000] p-1.5 rounded-lg border border-[#27272A]">
                  {testnetData.signerBalance}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#D4D4D8] text-[11px]">Contract Verification:</span>
                  <span className="text-[10px] font-mono text-[#FACC15] font-bold">27/27 Tests OK</span>
                </div>
                <div className="font-mono text-[10px] text-[#FFFFFF] bg-[#000000] p-1.5 rounded-lg border border-[#27272A]">
                  EvidenceRegistry.sol (Solidity 0.8.20)
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px]">
                <span className="text-[#D4D4D8]">Active Benchmark ID:</span>
                <span className="font-mono text-[#FFFFFF] font-semibold">{testnetData.evidenceId}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#D4D4D8]">Evidence SHA-256:</span>
                <span className="font-mono text-[#FACC15] font-semibold" title={testnetData.evidenceSha256}>
                  {testnetData.evidenceSha256.slice(0, 10)}...{testnetData.evidenceSha256.slice(-6)}
                </span>
              </div>
            </div>
          </div>

          <a
            href={testnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] hover:bg-[#FACC15]/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Open MSTScan Testnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 2: MST Mainnet */}
        <div className="bg-[#121212] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                <span className="text-xs font-extrabold text-[#FFFFFF]">{mainnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-extrabold">
                {mainnetData.verificationStatus}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#D4D4D8]">Chain ID:</span>
                <span className="font-mono text-[#EF4444] font-bold">{mainnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#D4D4D8]">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#FFFFFF] truncate max-w-[170px]" title={mainnetData.rpcUrl}>
                  {mainnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#27272A]">
                <div className="flex justify-between items-center">
                  <span className="text-[#D4D4D8] text-[11px]">Contract Address:</span>
                  <span className="text-[10px] font-mono text-[#EF4444] bg-[#EF4444]/15 px-1.5 py-0.5 rounded border border-[#EF4444]/30 font-bold">
                    {mainnetData.contractAddress}
                  </span>
                </div>
                <div className="text-[11px] text-[#D4D4D8] bg-[#000000] p-2 rounded-lg border border-[#27272A] leading-relaxed">
                  {mainnetData.policyNotice}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px]">
                <span className="text-[#D4D4D8]">Deployment Tx:</span>
                <span className="font-mono text-[#D4D4D8]">{mainnetData.deploymentTxHash}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#D4D4D8]">Verification Status:</span>
                <span className="font-mono text-[#EF4444] font-bold">{mainnetData.verificationStatus}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[11px] text-[#D4D4D8] leading-snug">
                <strong className="text-[#EF4444]">Mainnet Rule:</strong> Deploy and anchor on Mainnet only after Testnet verification and explicit authorization.
              </div>
            </div>
          </div>

          <a
            href={mainnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Open MSTScan Mainnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 3: Application & Source Code */}
        <div className="bg-[#121212] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#FACC15]" />
                <span className="text-xs font-extrabold text-[#FFFFFF]">Application &amp; Source Code</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 font-extrabold">
                PRODUCTION LIVE
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[#D4D4D8] text-[11px]">Live Application URL:</span>
                <div className="flex items-center justify-between bg-[#000000] p-1.5 rounded-lg border border-[#27272A]">
                  <a
                    href={appData.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#FACC15] hover:underline truncate text-[11px] font-bold"
                  >
                    {appData.liveUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.liveUrl, 'liveUrl')}
                    className="p-1 rounded text-[#D4D4D8] hover:text-[#FACC15] transition"
                  >
                    {copiedKey === 'liveUrl' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3 text-[#D4D4D8]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[#D4D4D8] text-[11px]">Public GitHub Repository:</span>
                <div className="flex items-center justify-between bg-[#000000] p-1.5 rounded-lg border border-[#27272A]">
                  <a
                    href={appData.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#FACC15] hover:underline truncate text-[11px] font-bold"
                  >
                    {appData.repoUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.repoUrl, 'repoUrl')}
                    className="p-1 rounded text-[#D4D4D8] hover:text-[#FACC15] transition"
                  >
                    {copiedKey === 'repoUrl' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3 text-[#D4D4D8]" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-[#27272A]">
                <span className="text-[#D4D4D8]">BridgeKey Integration:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 font-bold">
                  {appData.bridgeKeyStatus}
                </span>
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="text-[#D4D4D8] text-[11px]">Last End-to-End Test:</span>
                <div className="text-[10px] font-mono text-[#FFFFFF] bg-[#000000] p-2 rounded-lg border border-[#27272A] leading-relaxed">
                  {appData.lastTest}
                </div>
              </div>
            </div>
          </div>

          <a
            href={appData.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#000000] border border-[#27272A] hover:bg-[#1C1C1C] text-[#FFFFFF] transition flex items-center justify-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>View Public Repository</span>
          </a>
        </div>
      </div>
    </div>
  );
}
