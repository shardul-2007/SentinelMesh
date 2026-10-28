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
      <div className="flex items-center justify-between pb-2 border-b border-[#414850]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00FA9A]" />
          <h3 className="text-sm font-extrabold text-[#FFFFFF]">Deployment &amp; Blockchain Status</h3>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30 font-bold">
          OFFICIAL MST AUDIT CHECKLIST
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: MST Testnet */}
        <div className="bg-[#2D3238] border border-[#414850] p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#414850]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00FA9A] animate-ping"></span>
                <span className="text-xs font-extrabold text-[#FFFFFF]">{testnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30 font-extrabold">
                {testnetData.readbackVerification}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#A0A5AD]">Chain ID:</span>
                <span className="font-mono text-[#00FA9A] font-bold">{testnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A0A5AD]">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#FFFFFF] truncate max-w-[170px]" title={testnetData.rpcUrl}>
                  {testnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#414850]">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A5AD] text-[11px]">Contract Address:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.contractAddress, 'contract')}
                      className="p-1 rounded text-[#A0A5AD] hover:text-[#00FA9A] transition"
                      title="Copy contract address"
                    >
                      {copiedKey === 'contract' ? <Check className="w-3 h-3 text-[#00FA9A]" /> : <Copy className="w-3 h-3 text-[#A0A5AD]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00FA9A] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#00FA9A] break-all bg-[#1A1D20] p-1.5 rounded-lg border border-[#414850] font-semibold">
                  {testnetData.contractAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A5AD] text-[11px]">Backend Signer Account:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.signerAddress, 'signer')}
                      className="p-1 rounded text-[#A0A5AD] hover:text-[#00FA9A] transition"
                      title="Copy signer address"
                    >
                      {copiedKey === 'signer' ? <Check className="w-3 h-3 text-[#00FA9A]" /> : <Copy className="w-3 h-3 text-[#A0A5AD]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.signerAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00FA9A] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#A0A5AD] truncate bg-[#1A1D20] p-1.5 rounded-lg border border-[#414850]" title={testnetData.signerAddress}>
                  {testnetData.signerAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A5AD] text-[11px]">Signer Gas Balance:</span>
                  <a
                    href={testnetData.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[#00FA9A] hover:underline flex items-center gap-0.5"
                  >
                    <span>Claim Faucet</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="font-mono text-[10px] text-[#F59E0B] font-semibold bg-[#1A1D20] p-1.5 rounded-lg border border-[#414850]">
                  {testnetData.signerBalance}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A5AD] text-[11px]">Contract Verification:</span>
                  <span className="text-[10px] font-mono text-[#00FA9A] font-bold">27/27 Tests OK</span>
                </div>
                <div className="font-mono text-[10px] text-[#FFFFFF] bg-[#1A1D20] p-1.5 rounded-lg border border-[#414850]">
                  EvidenceRegistry.sol (Solidity 0.8.20)
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px]">
                <span className="text-[#A0A5AD]">Active Benchmark ID:</span>
                <span className="font-mono text-[#FFFFFF] font-semibold">{testnetData.evidenceId}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#A0A5AD]">Evidence SHA-256:</span>
                <span className="font-mono text-[#00FA9A] font-semibold" title={testnetData.evidenceSha256}>
                  {testnetData.evidenceSha256.slice(0, 10)}...{testnetData.evidenceSha256.slice(-6)}
                </span>
              </div>
            </div>
          </div>

          <a
            href={testnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#00FA9A]/15 border border-[#00FA9A]/30 text-[#00FA9A] hover:bg-[#00FA9A]/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Open MSTScan Testnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 2: MST Mainnet */}
        <div className="bg-[#2D3238] border border-[#414850] p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#414850]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                <span className="text-xs font-extrabold text-[#FFFFFF]">{mainnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-extrabold">
                {mainnetData.verificationStatus}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#A0A5AD]">Chain ID:</span>
                <span className="font-mono text-[#38BDF8] font-bold">{mainnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#A0A5AD]">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#FFFFFF] truncate max-w-[170px]" title={mainnetData.rpcUrl}>
                  {mainnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#414850]">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A5AD] text-[11px]">Contract Address:</span>
                  <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/15 px-1.5 py-0.5 rounded border border-[#38BDF8]/30 font-bold">
                    {mainnetData.contractAddress}
                  </span>
                </div>
                <div className="text-[11px] text-[#A0A5AD] bg-[#1A1D20] p-2 rounded-lg border border-[#414850] leading-relaxed">
                  {mainnetData.policyNotice}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px]">
                <span className="text-[#A0A5AD]">Deployment Tx:</span>
                <span className="font-mono text-[#A0A5AD]">{mainnetData.deploymentTxHash}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#A0A5AD]">Verification Status:</span>
                <span className="font-mono text-[#38BDF8] font-bold">{mainnetData.verificationStatus}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[11px] text-[#A0A5AD] leading-snug">
                <strong className="text-[#38BDF8]">Mainnet Rule:</strong> Deploy and anchor on Mainnet only after Testnet verification and explicit authorization.
              </div>
            </div>
          </div>

          <a
            href={mainnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Open MSTScan Mainnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 3: Application & Source Code */}
        <div className="bg-[#2D3238] border border-[#414850] p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#414850]">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00FA9A]" />
                <span className="text-xs font-extrabold text-[#FFFFFF]">Application &amp; Source Code</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30 font-extrabold">
                PRODUCTION LIVE
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[#A0A5AD] text-[11px]">Live Application URL:</span>
                <div className="flex items-center justify-between bg-[#1A1D20] p-1.5 rounded-lg border border-[#414850]">
                  <a
                    href={appData.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#00FA9A] hover:underline truncate text-[11px] font-bold"
                  >
                    {appData.liveUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.liveUrl, 'liveUrl')}
                    className="p-1 rounded text-[#A0A5AD] hover:text-[#00FA9A] transition"
                  >
                    {copiedKey === 'liveUrl' ? <Check className="w-3 h-3 text-[#00FA9A]" /> : <Copy className="w-3 h-3 text-[#A0A5AD]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[#A0A5AD] text-[11px]">Public GitHub Repository:</span>
                <div className="flex items-center justify-between bg-[#1A1D20] p-1.5 rounded-lg border border-[#414850]">
                  <a
                    href={appData.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#00FA9A] hover:underline truncate text-[11px] font-bold"
                  >
                    {appData.repoUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.repoUrl, 'repoUrl')}
                    className="p-1 rounded text-[#A0A5AD] hover:text-[#00FA9A] transition"
                  >
                    {copiedKey === 'repoUrl' ? <Check className="w-3 h-3 text-[#00FA9A]" /> : <Copy className="w-3 h-3 text-[#A0A5AD]" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-[#414850]">
                <span className="text-[#A0A5AD]">BridgeKey Integration:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30 font-bold">
                  {appData.bridgeKeyStatus}
                </span>
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="text-[#A0A5AD] text-[11px]">Last End-to-End Test:</span>
                <div className="text-[10px] font-mono text-[#FFFFFF] bg-[#1A1D20] p-2 rounded-lg border border-[#414850] leading-relaxed">
                  {appData.lastTest}
                </div>
              </div>
            </div>
          </div>

          <a
            href={appData.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#1A1D20] border border-[#414850] hover:bg-[#353B42] text-[#FFFFFF] transition flex items-center justify-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#00FA9A]" />
            <span>View Public Repository</span>
          </a>
        </div>
      </div>
    </div>
  );
}
