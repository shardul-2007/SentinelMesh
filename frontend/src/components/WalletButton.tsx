'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Layers, 
  Globe, 
  ShieldCheck, 
  Lock
} from 'lucide-react';
import { useWeb3Wallet, MST_NETWORKS } from '@/lib/web3Wallet';

export function WalletButton() {
  const {
    isWalletAvailable,
    isBridgeKey,
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
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-950/60 shadow-[0_0_15px_rgba(255,153,0,0.15)]'
              : 'bg-orange-950/40 border-orange-500/40 text-orange-300 hover:border-orange-400 hover:bg-orange-950/60 shadow-[0_0_15px_rgba(251,100,27,0.15)]'
            : 'bg-[#111317] border-[#2E3442] text-[#FFFFFF] hover:border-amber-500/40 hover:bg-[#222630]'
        }`}
        title={isConnected ? 'View Connected Wallet & Network' : 'Connect BridgeKey / Web3 Wallet'}
      >
        <Wallet className={`w-3.5 h-3.5 ${isConnected ? (isCorrectNetwork ? 'text-[#FF9900]' : 'text-[#FB641B]') : 'text-[#9E9EA8]'}`} />
        
        {isConnecting ? (
          <span className="animate-pulse">Connecting...</span>
        ) : isConnected && address ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span>{formatAddress(address)}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
              isCorrectNetwork 
                ? 'bg-amber-500/20 text-[#FF9900] border-amber-500/30' 
                : 'bg-orange-500/20 text-[#FB641B] border-orange-500/30'
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
          <div className="bg-[#1A1D24] border border-[#2E3442] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative font-sans">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#2E3442] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#FF9900]">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#FFFFFF]">BridgeKey Wallet Integration</h3>
                  <p className="text-[11px] text-[#9E9EA8]">MST Blockchain direct transaction signing</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#9E9EA8] hover:text-[#FFFFFF] hover:bg-[#222630] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {isConnected && address ? (
              <div className="space-y-4">
                {/* Account Details Box */}
                <div className="p-4 rounded-xl bg-[#111317] border border-[#2E3442] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9E9EA8] font-bold">Provider:</span>
                    <span className="font-extrabold text-[#FF9900] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF9900] animate-ping"></span>
                      {walletName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9E9EA8] font-bold">Account Address:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[#FFFFFF] font-bold">{formatAddress(address)}</span>
                      <button
                        onClick={handleCopy}
                        className="p-1 rounded text-[#9E9EA8] hover:text-[#FF9900] transition"
                        title="Copy full address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9E9EA8] font-bold">Native Balance:</span>
                    <span className="font-mono text-emerald-400 font-extrabold text-sm">
                      {balance || '0.0000 tMSTC'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2E3442]/80">
                    <span className="text-[#9E9EA8] font-bold">Active Chain ID:</span>
                    <span className="font-mono font-bold text-[#FFFFFF]">{chainId ? `#${chainId}` : 'Unknown'}</span>
                  </div>
                </div>

                {/* Network Switching Section */}
                <div>
                  <span className="text-[11px] font-extrabold text-[#9E9EA8] uppercase tracking-wider block mb-2">
                    Network Selection (1-Click Switch)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {/* MST Testnet */}
                    <button
                      onClick={() => handleSwitch('testnet')}
                      disabled={chainId === MST_NETWORKS.testnet.chainIdDec || switchingNetwork !== null}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        chainId === MST_NETWORKS.testnet.chainIdDec
                          ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(255,153,0,0.15)]'
                          : 'bg-[#111317] border-[#2E3442] hover:border-amber-500/30 hover:bg-[#222630]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#FFFFFF]">MST Testnet</span>
                        {chainId === MST_NETWORKS.testnet.chainIdDec && (
                          <span className="w-2 h-2 rounded-full bg-[#FF9900]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#FF9900]">Chain: 91562037</span>
                      <span className="text-[10px] text-[#9E9EA8] mt-1">Registry Deployed</span>
                    </button>

                    {/* MST Mainnet */}
                    <button
                      onClick={() => handleSwitch('mainnet')}
                      disabled={chainId === MST_NETWORKS.mainnet.chainIdDec || switchingNetwork !== null}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        chainId === MST_NETWORKS.mainnet.chainIdDec
                          ? 'bg-orange-950/40 border-orange-500/50 shadow-[0_0_15px_rgba(251,100,27,0.15)]'
                          : 'bg-[#111317] border-[#2E3442] hover:border-orange-500/30 hover:bg-[#222630]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#FFFFFF]">MST Mainnet</span>
                        {chainId === MST_NETWORKS.mainnet.chainIdDec && (
                          <span className="w-2 h-2 rounded-full bg-[#FB641B]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#FB641B]">Chain: 4646</span>
                      <span className="text-[10px] text-[#9E9EA8] mt-1">Governed Deployment</span>
                    </button>
                  </div>

                  {chainId === MST_NETWORKS.mainnet.chainIdDec && (
                    <p className="text-[11px] text-amber-400 mt-2 p-2 rounded bg-amber-950/30 border border-amber-800/40">
                      <strong>Mainnet Protocol:</strong> Production anchoring requires explicit audit sign-off and authorized treasury funds.
                    </p>
                  )}
                </div>

                {/* Disconnect Action */}
                <div className="pt-2 border-t border-[#2E3442] flex justify-between items-center">
                  <a
                    href={activeNetwork ? `${activeNetwork.explorerUrl}/address/${address}` : `https://testnet.mstscan.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF9900] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View on MSTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-950/30 border border-red-800/40 hover:bg-red-950/60 transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#9E9EA8] leading-relaxed">
                  Connect your <strong className="text-[#FFFFFF]">BridgeKey Wallet</strong> or any EVM-compatible browser wallet to directly authorize and sign cryptographic evidence commitments onto MST Blockchain.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,153,0,0.25)] min-h-[44px]"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{isConnecting ? 'Waiting for approval...' : 'Connect Injected Browser Wallet'}</span>
                  </button>
                </div>

                {!isWalletAvailable && (
                  <div className="p-3.5 rounded-xl bg-[#111317] border border-[#2E3442] text-[11px] text-[#9E9EA8] space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
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
                        className="text-[#FF9900] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Official MST Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://faucet.mstblockchain.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF9900] hover:underline flex items-center gap-1 font-bold"
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
