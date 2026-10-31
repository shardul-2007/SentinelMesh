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
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border min-h-[38px] ${
          isConnected
            ? isCorrectNetwork
              ? 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/15'
              : 'bg-[#D97706]/10 border-[#D97706]/30 text-[#D97706] hover:bg-[#D97706]/15'
            : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#172B4D] hover:bg-[#F8FAFC]'
        }`}
        title={isConnected ? 'View Connected Wallet & Network' : 'Connect BridgeKey / Web3 Wallet'}
      >
        <Wallet className={`w-3.5 h-3.5 ${isConnected ? (isCorrectNetwork ? 'text-[#2563EB]' : 'text-[#D97706]') : 'text-[#64748B]'}`} />
        
        {isConnecting ? (
          <span className="animate-pulse">Connecting...</span>
        ) : isConnected && address ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span>{formatAddress(address)}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
              isCorrectNetwork 
                ? 'bg-[#15803D]/15 text-[#15803D] border-[#15803D]/30' 
                : 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30'
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl relative font-sans">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D]">BridgeKey Wallet Integration</h3>
                  <p className="text-[11px] text-[#64748B]">MST Blockchain direct transaction signing</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/25 text-xs text-[#DC2626] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#DC2626]" />
                <span>{error}</span>
              </div>
            )}

            {isConnected && address ? (
              <div className="space-y-4">
                {/* Account Details Box */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-medium">Provider:</span>
                    <span className="font-bold text-[#2563EB] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping"></span>
                      {walletName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-medium">Account Address:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[#172B4D] font-bold">{formatAddress(address)}</span>
                      <button
                        onClick={handleCopy}
                        className="p-1 rounded text-[#64748B] hover:text-[#2563EB] transition"
                        title="Copy full address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-medium">Native Balance:</span>
                    <span className="font-mono text-[#15803D] font-bold text-sm">
                      {balance || '0.0000 tMSTC'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#E5E7EB]">
                    <span className="text-[#64748B] font-medium">Active Chain ID:</span>
                    <span className="font-mono font-bold text-[#172B4D]">{chainId ? `#${chainId}` : 'Unknown'}</span>
                  </div>
                </div>

                {/* Network Switching Section */}
                <div>
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                    Network Selection
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {/* MST Testnet */}
                    <button
                      onClick={() => handleSwitch('testnet')}
                      disabled={chainId === MST_NETWORKS.testnet.chainIdDec || switchingNetwork !== null}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        chainId === MST_NETWORKS.testnet.chainIdDec
                          ? 'bg-[#2563EB]/10 border-[#2563EB]/40 text-[#2563EB]'
                          : 'bg-[#F8FAFC] border-[#E5E7EB] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#172B4D]">MST Testnet</span>
                        {chainId === MST_NETWORKS.testnet.chainIdDec && (
                          <span className="w-2 h-2 rounded-full bg-[#15803D]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#2563EB]">Chain: 91562037</span>
                      <span className="text-[10px] text-[#64748B] mt-1">Registry Deployed</span>
                    </button>

                    {/* MST Mainnet */}
                    <button
                      onClick={() => handleSwitch('mainnet')}
                      disabled={chainId === MST_NETWORKS.mainnet.chainIdDec || switchingNetwork !== null}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        chainId === MST_NETWORKS.mainnet.chainIdDec
                          ? 'bg-[#DC2626]/10 border-[#DC2626]/40 text-[#DC2626]'
                          : 'bg-[#F8FAFC] border-[#E5E7EB] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#172B4D]">MST Mainnet</span>
                        {chainId === MST_NETWORKS.mainnet.chainIdDec && (
                          <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#DC2626]">Chain: 4646</span>
                      <span className="text-[10px] text-[#64748B] mt-1">Not Yet Deployed</span>
                    </button>
                  </div>
                </div>

                {/* Disconnect Action */}
                <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center">
                  <a
                    href={activeNetwork ? `${activeNetwork.explorerUrl}/address/${address}` : `https://testnet.mstscan.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View on MSTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/30 hover:bg-[#DC2626]/20 transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Connect your <strong className="text-[#172B4D]">BridgeKey Wallet</strong> or any EVM browser wallet to authorize and sign cryptographic evidence commitments onto MST Blockchain.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] transition flex items-center justify-center gap-2 shadow-xs min-h-[42px]"
                  >
                    <Wallet className="w-4 h-4 text-[#FFFFFF]" />
                    <span>{isConnecting ? 'Waiting for approval...' : 'Connect Injected Browser Wallet'}</span>
                  </button>
                </div>

                {!isWalletAvailable && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[11px] text-[#64748B] space-y-2">
                    <div className="flex items-center gap-1.5 text-[#D97706] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>No Injected Wallet Detected</span>
                    </div>
                    <p className="leading-relaxed">
                      Install the BridgeKey Wallet extension to sign on-chain transactions directly from your browser.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href="https://mstblockchain.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Official MST Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://faucet.mstblockchain.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
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
