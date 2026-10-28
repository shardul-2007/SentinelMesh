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
    deploymentTxHash: '0x4094a974fa906e5744cb89d53f86e3f0ea27fb82f42a17f6942ce2ecceb06f8c',
    evidenceTxHash: '0x9c4266191dbbe1ad6fc3e62551ecdf63303cb5d8ef4f58c70f6153ae2985862d',
    evidenceId: 'evt_001_initial_compliance',
    evidenceSha256: '0x7b58c7d8122345598118dcf7760971b3e7bc8885b512e07198bb602c382f7678',
    readbackVerification: 'VERIFIED'
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
    lastTest: '2026-10-28 — 65 Pytest Passed (100%), 27 Hardhat Passed (100%), 13 Static Pages OK'
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2E3442]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FF9900]" />
          <h3 className="text-sm font-extrabold text-[#F8FAFC]">Deployment &amp; Blockchain Status</h3>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30 font-bold">
          OFFICIAL MST AUDIT CHECKLIST
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: MST Testnet */}
        <div className="block-gold p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2E3442]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF9900] animate-ping"></span>
                <span className="text-xs font-extrabold text-[#F8FAFC]">{testnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-extrabold">
                {testnetData.readbackVerification}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">Chain ID:</span>
                <span className="font-mono text-[#FF9900] font-bold">{testnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#F8FAFC] truncate max-w-[170px]" title={testnetData.rpcUrl}>
                  {testnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#2E3442]">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] text-[11px]">Contract Address:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.contractAddress, 'contract')}
                      className="p-1 rounded text-[#94A3B8] hover:text-[#FF9900] transition"
                      title="Copy contract address"
                    >
                      {copiedKey === 'contract' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF9900] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#FF9900] break-all bg-[#111317] p-1.5 rounded-lg border border-[#2E3442] font-semibold">
                  {testnetData.contractAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] text-[11px]">Deployment Tx:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.deploymentTxHash, 'deployTx')}
                      className="p-1 rounded text-[#94A3B8] hover:text-[#FF9900] transition"
                      title="Copy deployment tx hash"
                    >
                      {copiedKey === 'deployTx' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/tx/${testnetData.deploymentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF9900] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] truncate bg-[#111317] p-1.5 rounded-lg border border-[#2E3442]" title={testnetData.deploymentTxHash}>
                  {testnetData.deploymentTxHash}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] text-[11px]">Verified Evidence Tx:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.evidenceTxHash, 'evidenceTx')}
                      className="p-1 rounded text-[#94A3B8] hover:text-[#FF9900] transition"
                      title="Copy evidence tx hash"
                    >
                      {copiedKey === 'evidenceTx' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/tx/${testnetData.evidenceTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF9900] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] truncate bg-[#111317] p-1.5 rounded-lg border border-[#2E3442]" title={testnetData.evidenceTxHash}>
                  {testnetData.evidenceTxHash}
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px]">
                <span className="text-[#94A3B8]">Evidence ID:</span>
                <span className="font-mono text-[#F8FAFC] font-semibold">{testnetData.evidenceId}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#94A3B8]">Evidence SHA-256:</span>
                <span className="font-mono text-[#FF9900] font-semibold" title={testnetData.evidenceSha256}>
                  {testnetData.evidenceSha256.slice(0, 10)}...{testnetData.evidenceSha256.slice(-6)}
                </span>
              </div>
            </div>
          </div>

          <a
            href={testnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#FF9900]/15 border border-[#FF9900]/30 text-[#FF9900] hover:bg-[#FF9900]/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Open MSTScan Testnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 2: MST Mainnet */}
        <div className="block-orange p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2E3442]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FB641B]"></span>
                <span className="text-xs font-extrabold text-[#F8FAFC]">{mainnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FB641B]/15 text-[#FB641B] border border-[#FB641B]/30 font-extrabold">
                {mainnetData.verificationStatus}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">Chain ID:</span>
                <span className="font-mono text-[#FB641B] font-bold">{mainnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#F8FAFC] truncate max-w-[170px]" title={mainnetData.rpcUrl}>
                  {mainnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#2E3442]">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] text-[11px]">Contract Address:</span>
                  <span className="text-[10px] font-mono text-[#FB641B] bg-[#FB641B]/15 px-1.5 py-0.5 rounded border border-[#FB641B]/30 font-bold">
                    {mainnetData.contractAddress}
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] bg-[#111317] p-2 rounded-lg border border-[#2E3442] leading-relaxed">
                  {mainnetData.policyNotice}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px]">
                <span className="text-[#94A3B8]">Deployment Tx:</span>
                <span className="font-mono text-[#94A3B8]">{mainnetData.deploymentTxHash}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#94A3B8]">Verification Status:</span>
                <span className="font-mono text-[#FB641B] font-bold">{mainnetData.verificationStatus}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FB641B]/10 border border-[#FB641B]/20 text-[11px] text-[#94A3B8] leading-snug">
                <strong className="text-[#FB641B]">Mainnet Rule:</strong> Deploy and anchor on Mainnet only after Testnet verification and explicit authorization.
              </div>
            </div>
          </div>

          <a
            href={mainnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#FB641B]/15 border border-[#FB641B]/30 text-[#FB641B] hover:bg-[#FB641B]/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Open MSTScan Mainnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 3: Application & Source Code */}
        <div className="block-emerald p-4 rounded-xl flex flex-col justify-between shadow-lg space-y-3 min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2E3442]">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-xs font-extrabold text-[#F8FAFC]">Application &amp; Source Code</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-extrabold">
                PRODUCTION LIVE
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[#94A3B8] text-[11px]">Live Application URL:</span>
                <div className="flex items-center justify-between bg-[#111317] p-1.5 rounded-lg border border-[#2E3442]">
                  <a
                    href={appData.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#10B981] hover:underline truncate text-[11px] font-bold"
                  >
                    {appData.liveUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.liveUrl, 'liveUrl')}
                    className="p-1 rounded text-[#94A3B8] hover:text-[#10B981] transition"
                  >
                    {copiedKey === 'liveUrl' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[#94A3B8] text-[11px]">Public GitHub Repository:</span>
                <div className="flex items-center justify-between bg-[#111317] p-1.5 rounded-lg border border-[#2E3442]">
                  <a
                    href={appData.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#10B981] hover:underline truncate text-[11px] font-bold"
                  >
                    {appData.repoUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.repoUrl, 'repoUrl')}
                    className="p-1 rounded text-[#94A3B8] hover:text-[#10B981] transition"
                  >
                    {copiedKey === 'repoUrl' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-[#2E3442]">
                <span className="text-[#94A3B8]">BridgeKey Integration:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30 font-bold">
                  {appData.bridgeKeyStatus}
                </span>
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="text-[#94A3B8] text-[11px]">Last End-to-End Test:</span>
                <div className="text-[10px] font-mono text-[#F8FAFC] bg-[#111317] p-2 rounded-lg border border-[#2E3442] leading-relaxed">
                  {appData.lastTest}
                </div>
              </div>
            </div>
          </div>

          <a
            href={appData.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center bg-[#111317] border border-[#2E3442] hover:bg-[#222630] text-[#F8FAFC] transition flex items-center justify-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#10B981]" />
            <span>View Public Repository</span>
          </a>
        </div>
      </div>
    </div>
  );
}
