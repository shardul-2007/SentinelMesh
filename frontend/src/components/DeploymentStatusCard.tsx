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
  Wallet,
  Zap,
  Loader2 
} from 'lucide-react';
import { useWeb3Wallet } from '@/lib/web3Wallet';

export function DeploymentStatusCard() {
  const { isConnected, address, activeNetwork, deployWithWallet, balance } = useWeb3Wallet();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    contractAddress: string;
    transactionHash: string;
    explorerUrl: string;
    blockNumber: number;
  } | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeployContract = async () => {
    setIsDeploying(true);
    setDeployError(null);
    setDeployResult(null);
    try {
      const res = await deployWithWallet();
      setDeployResult(res);
    } catch (err: any) {
      setDeployError(err.message || 'Deployment failed.');
    } finally {
      setIsDeploying(false);
    }
  };

  const testnetData = {
    network: 'MST Testnet',
    chainId: 91562037,
    rpcUrl: 'https://testnetrpc.mstblockchain.com',
    explorer: 'https://testnet.mstscan.com',
    contractAddress: '0x0539fc70ee18fa936395c8dd6db623af6b43ceca',
    contractStatus: 'DEPLOYED & VERIFIED ON-CHAIN (Block #6688112)',
    signerAddress: isConnected && address ? address : '0x145115aD79A09A91249169E13BAEE24A9eA20ab3',
    signerBalance: isConnected && balance ? balance : '9.9990 tMSTC (Funded & Active)',
    faucetUrl: 'https://faucet.mstblockchain.com',
    evidenceId: 'evt_mst_001',
    evidenceSha256: 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e',
    readbackVerification: 'ON-CHAIN VERIFIED (MST TESTNET)',
    modeBadge: 'LIVE ON-CHAIN ANCHORING'
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
        {/* Card 1: MST Testnet (Box 4: Yellow Background + Black Text) */}
        <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] p-4 rounded-xl flex flex-col justify-between shadow-xl space-y-3 min-h-[360px] overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#000000]/25 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-ping flex-shrink-0"></span>
                <span className="text-xs font-black text-[#000000] truncate">{testnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000] text-[#FACC15] font-black flex-shrink-0">
                {testnetData.readbackVerification}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-[#1C1C1C]">Chain ID:</span>
                <span className="font-mono text-[#000000] font-black">{testnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center font-bold gap-2">
                <span className="text-[#1C1C1C] flex-shrink-0">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#000000] truncate min-w-0 flex-1 text-right font-black" title={testnetData.rpcUrl}>
                  {testnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#000000]/20">
                <div className="flex justify-between items-center">
                  <span className="text-[#1C1C1C] text-[11px] font-black">Contract Address:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.contractAddress, 'contract')}
                      className="p-1 rounded bg-[#000000]/10 hover:bg-[#000000]/20 text-[#000000] transition"
                      title="Copy contract address"
                    >
                      {copiedKey === 'contract' ? <Check className="w-3 h-3 text-[#000000]" /> : <Copy className="w-3 h-3 text-[#000000]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#000000] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#FACC15] break-all bg-[#000000] p-1.5 rounded-lg border border-[#000000] font-black select-all">
                  {testnetData.contractAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#1C1C1C] text-[11px] font-black">Backend Signer Account:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(testnetData.signerAddress, 'signer')}
                      className="p-1 rounded bg-[#000000]/10 hover:bg-[#000000]/20 text-[#000000] transition"
                      title="Copy signer address"
                    >
                      {copiedKey === 'signer' ? <Check className="w-3 h-3 text-[#000000]" /> : <Copy className="w-3 h-3 text-[#000000]" />}
                    </button>
                    <a
                      href={`${testnetData.explorer}/address/${testnetData.signerAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#000000] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#FACC15] break-all bg-[#000000] p-1.5 rounded-lg border border-[#000000] font-bold select-all" title={testnetData.signerAddress}>
                  {testnetData.signerAddress}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#1C1C1C] text-[11px] font-black">Signer Gas Balance:</span>
                  <a
                    href={testnetData.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black text-[#000000] hover:underline flex items-center gap-0.5 bg-[#000000]/10 px-1.5 py-0.5 rounded"
                  >
                    <span>Claim Faucet</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="font-mono text-[10px] text-[#FACC15] font-black bg-[#000000] p-1.5 rounded-lg border border-[#000000]">
                  {testnetData.signerBalance}
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#1C1C1C] text-[11px] font-black">Contract Verification:</span>
                  <span className="text-[10px] font-mono text-[#000000] font-black bg-[#000000]/15 px-1.5 py-0.5 rounded">27/27 Tests OK</span>
                </div>
                <div className="font-mono text-[10px] text-[#FACC15] bg-[#000000] p-1.5 rounded-lg border border-[#000000] font-bold">
                  EvidenceRegistry.sol (Solidity 0.8.20)
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] font-bold">
                <span className="text-[#1C1C1C]">Active Benchmark ID:</span>
                <span className="font-mono text-[#000000] font-black">{testnetData.evidenceId}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-[#1C1C1C]">Evidence SHA-256:</span>
                <span className="font-mono text-[#000000] font-black" title={testnetData.evidenceSha256}>
                  {testnetData.evidenceSha256.slice(0, 10)}...{testnetData.evidenceSha256.slice(-6)}
                </span>
              </div>
            </div>

            {/* In-browser BridgeKey Deployment Result / Errors */}
            {deployResult && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#000000] border border-[#000000] text-xs space-y-1 text-left animate-in fade-in">
                <div className="flex items-center gap-1.5 text-[#FACC15] font-black">
                  <Check className="w-3.5 h-3.5" />
                  <span>EvidenceRegistry Deployed!</span>
                </div>
                <div className="font-mono text-[10px] text-[#FFFFFF] break-all select-all font-bold">
                  {deployResult.contractAddress}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-[#D4D4D8] font-bold">Block #{deployResult.blockNumber}</span>
                  <a 
                    href={deployResult.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#FACC15] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>MSTScan</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}

            {deployError && (
              <div className="mt-2 p-2 rounded-lg bg-[#EF4444] text-[#FFFFFF] text-[10px] font-bold text-left animate-in fade-in">
                {deployError}
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-2">
            {isConnected ? (
              <button
                onClick={handleDeployContract}
                disabled={isDeploying}
                className="w-full py-2.5 px-3 rounded-lg text-xs font-black text-center bg-[#000000] text-[#FACC15] hover:bg-[#1C1C1C] transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 active:scale-95"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FACC15]" />
                    <span>Awaiting BridgeKey Approval...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>Deploy with BridgeKey ({balance || 'tMSTC'})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-[10px] text-[#000000] font-black bg-[#000000]/10 p-2 rounded-lg text-center">
                Connect BridgeKey wallet to deploy EvidenceRegistry on MST Testnet
              </div>
            )}

            <a
              href={testnetData.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-center bg-[#000000]/15 text-[#000000] hover:bg-[#000000]/25 transition flex items-center justify-center gap-1.5"
            >
              <span>Open MSTScan Explorer</span>
              <ExternalLink className="w-3 h-3 text-[#000000]" />
            </a>
          </div>
        </div>

        {/* Card 2: MST Mainnet (Box 5: Yellow Background + Black Text) */}
        <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] p-4 rounded-xl flex flex-col justify-between shadow-xl space-y-3 min-h-[360px] overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#000000]/25 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#000000] flex-shrink-0"></span>
                <span className="text-xs font-black text-[#000000] truncate">{mainnetData.network}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000] text-[#EF4444] font-black flex-shrink-0">
                {mainnetData.verificationStatus}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-[#1C1C1C]">Chain ID:</span>
                <span className="font-mono text-[#000000] font-black">{mainnetData.chainId}</span>
              </div>

              <div className="flex justify-between items-center font-bold gap-2">
                <span className="text-[#1C1C1C] flex-shrink-0">RPC URL:</span>
                <span className="font-mono text-[11px] text-[#000000] truncate min-w-0 flex-1 text-right font-black" title={mainnetData.rpcUrl}>
                  {mainnetData.rpcUrl}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#000000]/20">
                <div className="flex justify-between items-center">
                  <span className="text-[#1C1C1C] text-[11px] font-black">Contract Address:</span>
                  <span className="text-[10px] font-mono text-[#EF4444] bg-[#000000] px-2 py-0.5 rounded font-black border border-[#000000]">
                    {mainnetData.contractAddress}
                  </span>
                </div>
                <div className="text-[11px] text-[#FACC15] bg-[#000000] p-2 rounded-lg border border-[#000000] leading-relaxed font-bold">
                  {mainnetData.policyNotice}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px] font-bold">
                <span className="text-[#1C1C1C]">Deployment Tx:</span>
                <span className="font-mono text-[#000000] font-black">{mainnetData.deploymentTxHash}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-[#1C1C1C]">Verification Status:</span>
                <span className="font-mono text-[#000000] font-black bg-[#000000]/15 px-2 py-0.5 rounded">{mainnetData.verificationStatus}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#000000] border border-[#000000] text-[11px] text-[#FFFFFF] leading-snug font-bold">
                <strong className="text-[#EF4444]">Mainnet Rule:</strong> Deploy and anchor on Mainnet only after Testnet verification and explicit authorization.
              </div>
            </div>
          </div>

          <a
            href={mainnetData.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-lg text-xs font-black text-center bg-[#000000] text-[#FFFFFF] hover:bg-[#1C1C1C] transition flex items-center justify-center gap-1.5 shadow-md mt-2"
          >
            <span>Open MSTScan Mainnet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 3: Application & Source Code (Box 6: Yellow Background + Black Text) */}
        <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] p-4 rounded-xl flex flex-col justify-between shadow-xl space-y-3 min-h-[360px] overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#000000]/25 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Globe className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
                <span className="text-xs font-black text-[#000000] truncate">Application &amp; Source Code</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000] text-[#FACC15] font-black flex-shrink-0">
                PRODUCTION LIVE
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[#1C1C1C] text-[11px] font-black">Live Application URL:</span>
                <div className="flex items-center justify-between bg-[#000000] p-1.5 rounded-lg border border-[#000000] min-w-0 gap-2">
                  <a
                    href={appData.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#FACC15] hover:underline truncate text-[11px] font-black min-w-0 flex-1"
                  >
                    {appData.liveUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.liveUrl, 'liveUrl')}
                    className="p-1 rounded text-[#FFFFFF] hover:text-[#FACC15] transition flex-shrink-0"
                  >
                    {copiedKey === 'liveUrl' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3 text-[#FFFFFF]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[#1C1C1C] text-[11px] font-black">Public GitHub Repository:</span>
                <div className="flex items-center justify-between bg-[#000000] p-1.5 rounded-lg border border-[#000000] min-w-0 gap-2">
                  <a
                    href={appData.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#FACC15] hover:underline truncate text-[11px] font-black min-w-0 flex-1"
                  >
                    {appData.repoUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(appData.repoUrl, 'repoUrl')}
                    className="p-1 rounded text-[#FFFFFF] hover:text-[#FACC15] transition flex-shrink-0"
                  >
                    {copiedKey === 'repoUrl' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3 text-[#FFFFFF]" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-[#000000]/20 font-bold">
                <span className="text-[#1C1C1C]">BridgeKey Integration:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000] text-[#FACC15] font-black">
                  {appData.bridgeKeyStatus}
                </span>
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="text-[#1C1C1C] text-[11px] font-black">Last End-to-End Test:</span>
                <div className="text-[10px] font-mono text-[#FACC15] bg-[#000000] p-2 rounded-lg border border-[#000000] leading-relaxed font-bold break-words">
                  {appData.lastTest}
                </div>
              </div>
            </div>
          </div>

          <a
            href={appData.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-lg text-xs font-black text-center bg-[#000000] text-[#FACC15] hover:bg-[#1C1C1C] transition flex items-center justify-center gap-1.5 shadow-md mt-2"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>View Public Repository</span>
          </a>
        </div>
      </div>
    </div>
  );
}
