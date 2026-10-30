'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { useWeb3Wallet, MST_NETWORKS } from '@/lib/web3Wallet';

export function WalletButton() {
  const {
    isWalletAvailable,
    walletName,
    isConnected,
    address,
    chainId,
    activeNetwork,
    isCorrectNetwork,
    balance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isModalOpen,
    setIsModalOpen
  } = useWeb3Wallet();

  const [copied, setCopied] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState<string | null>(null);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitch = async (key: 'testnet' | 'mainnet') => {
    setSwitchingNetwork(key);
    try {
      await switchNetwork(key);
    } finally {
      setSwitchingNetwork(null);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      {/* Header Button Trigger */}
      <button
        onClick={() => {
          if (!isConnected) {
            connectWallet();
          } else {
            setIsModalOpen(true);
          }
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border min-h-[40px] ${
          isConnected
            ? isCorrectNetwork
              ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8] hover:border-[#38BDF8]'
              : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B] hover:border-[#F59E0B]'
            : 'bg-[#151F30] border-[#263449] text-[#F8FAFC] hover:border-[#38BDF8]/40 hover:bg-[#1E293B]'
        }`}
        title={isConnected ? 'View Connected Wallet & Network' : 'Connect BridgeKey / Web3 Wallet'}
      >
        <Wallet className={`w-3.5 h-3.5 ${isConnected ? (isCorrectNetwork ? 'text-[#38BDF8]' : 'text-[#F59E0B]') : 'text-[#94A3B8]'}`} />
        
        {isConnecting ? (
          <span className="animate-pulse">Connecting...</span>
        ) : isConnected && address ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span>{formatAddress(address)}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
              isCorrectNetwork 
                ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30' 
                : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30'
            }`}>
              {activeNetwork ? activeNetwork.symbol : 'Wrong Net'}
            </span>
          </div>
        ) : (
          <span className="hidden sm:inline">BridgeKey Connect</span>
        )}
      </button>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#151F30] border border-[#263449] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative font-sans">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#263449] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#F8FAFC]">BridgeKey Wallet Integration</h3>
                  <p className="text-[11px] text-[#94A3B8]">MST Blockchain direct transaction signing</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#EF4444]" />
                <span>{error}</span>
              </div>
            )}

            {isConnected && address ? (
              <div className="space-y-4">
                {/* Account Details Box */}
                <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8] font-bold">Provider:</span>
                    <span className="font-extrabold text-[#38BDF8] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping"></span>
                      {walletName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8] font-bold">Account Address:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[#F8FAFC] font-bold">{formatAddress(address)}</span>
                      <button
                        onClick={handleCopy}
                        className="p-1 rounded text-[#94A3B8] hover:text-[#38BDF8] transition"
                        title="Copy full address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8] font-bold">Native Balance:</span>
                    <span className="font-mono text-[#22C55E] font-extrabold text-sm">
                      {balance || '0.0000 tMSTC'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#263449]">
                    <span className="text-[#94A3B8] font-bold">Active Chain ID:</span>
                    <span className="font-mono font-bold text-[#F8FAFC]">{chainId ? `#${chainId}` : 'Unknown'}</span>
                  </div>
                </div>

                {/* Network Switching Section */}
                <div>
                  <span className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider block mb-2">
                    Network Selection (1-Click Switch)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {/* MST Testnet */}
                    <button
                      onClick={() => handleSwitch('testnet')}
                      disabled={chainId === MST_NETWORKS.testnet.chainIdDec || switchingNetwork !== null}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        chainId === MST_NETWORKS.testnet.chainIdDec
                          ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                          : 'bg-[#101827] border-[#263449] hover:border-[#38BDF8]/30 hover:bg-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#F8FAFC]">MST Testnet</span>
                        {chainId === MST_NETWORKS.testnet.chainIdDec && (
                          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#38BDF8]">Chain: 91562037</span>
                      <span className="text-[10px] text-[#94A3B8] mt-1">Registry Deployed</span>
                    </button>

                    {/* MST Mainnet */}
                    <button
                      onClick={() => handleSwitch('mainnet')}
                      disabled={chainId === MST_NETWORKS.mainnet.chainIdDec || switchingNetwork !== null}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        chainId === MST_NETWORKS.mainnet.chainIdDec
                          ? 'bg-[#EF4444]/15 border-[#EF4444]/50 text-[#EF4444]'
                          : 'bg-[#101827] border-[#263449] hover:border-[#EF4444]/30 hover:bg-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#F8FAFC]">MST Mainnet</span>
                        {chainId === MST_NETWORKS.mainnet.chainIdDec && (
                          <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#EF4444]">Chain: 4646</span>
                      <span className="text-[10px] text-[#94A3B8] mt-1">Governed Deployment</span>
                    </button>
                  </div>

                  {chainId === MST_NETWORKS.mainnet.chainIdDec && (
                    <p className="text-[11px] text-[#F59E0B] mt-2 p-2 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/40">
                      <strong>Mainnet Protocol:</strong> Production anchoring requires explicit audit sign-off and authorized treasury funds.
                    </p>
                  )}
                </div>

                {/* Disconnect Action */}
                <div className="pt-2 border-t border-[#263449] flex justify-between items-center">
                  <a
                    href={activeNetwork ? `${activeNetwork.explorerUrl}/address/${address}` : `https://testnet.mstscan.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View on MSTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444]/40 hover:bg-[#EF4444]/30 transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Connect your <strong className="text-[#F8FAFC]">BridgeKey Wallet</strong> or any EVM-compatible browser wallet to directly authorize and sign cryptographic evidence commitments onto MST Blockchain.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#38BDF8] hover:bg-[#0284C7] text-[#090D16] transition flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                  >
                    <Wallet className="w-4 h-4 text-[#090D16]" />
                    <span>{isConnecting ? 'Waiting for approval...' : 'Connect Injected Browser Wallet'}</span>
                  </button>
                </div>

                {!isWalletAvailable && (
                  <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] text-[11px] text-[#94A3B8] space-y-2">
                    <div className="flex items-center gap-1.5 text-[#F59E0B] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>No Injected Wallet Detected</span>
                    </div>
                    <p className="leading-relaxed">
                      Install the BridgeKey Wallet extension or MetaMask to sign on-chain transactions directly from your browser.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href="https://mstblockchain.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Official MST Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://faucet.mstblockchain.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>tMSTC Faucet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
