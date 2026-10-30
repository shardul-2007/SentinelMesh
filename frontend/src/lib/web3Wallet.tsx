'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EVIDENCE_REGISTRY_BYTECODE } from './contracts/EvidenceRegistryBytecode';

export interface MSTNetworkConfig {
  key: 'testnet' | 'mainnet';
  chainIdDec: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  symbol: string;
  contractAddress: string;
  faucetUrl?: string;
  isMainnet: boolean;
}

export const MST_NETWORKS: Record<'testnet' | 'mainnet', MSTNetworkConfig> = {
  testnet: {
    key: 'testnet',
    chainIdDec: 91562037,
    chainIdHex: '0x5752035',
    name: 'MST Testnet',
    rpcUrl: 'https://testnetrpc.mstblockchain.com',
    explorerUrl: 'https://testnet.mstscan.com',
    symbol: 'tMSTC',
    contractAddress: '0x0539fc70ee18fa936395c8dd6db623af6b43ceca',
    faucetUrl: 'https://faucet.mstblockchain.com',
    isMainnet: false,
  },
  mainnet: {
    key: 'mainnet',
    chainIdDec: 4646,
    chainIdHex: '0x1226',
    name: 'MST Mainnet',
    rpcUrl: 'https://mariorpc.mstblockchain.com/',
    explorerUrl: 'https://mstscan.com',
    symbol: 'MSTC',
    contractAddress: '', // Deploy only after Testnet validation and authorization
    isMainnet: true,
  }
};

interface Web3WalletContextType {
  isWalletAvailable: boolean;
  isBridgeKey: boolean;
  walletName: string;
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  activeNetwork: MSTNetworkConfig | null;
  isCorrectNetwork: boolean;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (target: 'testnet' | 'mainnet') => Promise<boolean>;
  anchorWithWallet: (eventId: string, hashHex: string) => Promise<{ transactionHash: string; explorerUrl: string }>;
  deployWithWallet: () => Promise<{
    transactionHash: string;
    contractAddress: string;
    explorerUrl: string;
    blockNumber: number;
  }>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const Web3WalletContext = createContext<Web3WalletContextType | undefined>(undefined);

// Helper to locate injected Web3 provider (BridgeKey or standard EVM)
export function getInjectedProvider(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.bridgekey || w.bridgeKey || w.BridgeKey || w.ethereum || null;
}

// Helper to encode recordEvidence(string,bytes32) ABI call
function encodeRecordEvidence(evidenceId: string, evidenceHashHex: string): string {
  const selector = '4502d959';
  const offset = '0000000000000000000000000000000000000000000000000000000000000040'; // 64 in hex
  const cleanHash = evidenceHashHex.replace(/^0x/, '').padStart(64, '0').slice(0, 64);
  
  const idUtf8 = new TextEncoder().encode(evidenceId);
  const idLenHex = idUtf8.length.toString(16).padStart(64, '0');
  
  let idHex = '';
  for (let i = 0; i < idUtf8.length; i++) {
    idHex += idUtf8[i].toString(16).padStart(2, '0');
  }
  // Pad to 32-byte boundary
  const paddedLen = Math.ceil(idHex.length / 64) * 64;
  idHex = idHex.padEnd(paddedLen, '0');

  return '0x' + selector + offset + cleanHash + idLenHex + idHex;
}

export function Web3WalletProvider({ children }: { children: ReactNode }) {
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);
  const [isBridgeKey, setIsBridgeKey] = useState(false);
  const [walletName, setWalletName] = useState('BridgeKey / Web3');
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check injected wallet (BridgeKey / Ethereum) availability
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const provider = getInjectedProvider();
    if (provider) {
      setIsWalletAvailable(true);
      const isBk = !!(
        provider.isBridgeKey || 
        (window as any).bridgekey || 
        (window as any).bridgeKey || 
        (window as any).BridgeKey
      );
      setIsBridgeKey(isBk);
      setWalletName(isBk ? 'BridgeKey Wallet' : (provider.isMetaMask ? 'MetaMask / BridgeKey' : 'EVM Web3 Wallet'));

      // Check already connected
      provider.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            updateChainAndBalance(accounts[0]);
          }
        })
        .catch(() => {});

      // Listeners
      const handleAccountsChanged = (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          setIsConnected(false);
          setAddress(null);
          setBalance(null);
        } else {
          setAddress(accounts[0]);
          setIsConnected(true);
          updateChainAndBalance(accounts[0]);
        }
      };

      const handleChainChanged = (newChainHex: string) => {
        const id = parseInt(newChainHex, 16);
        setChainId(id);
        if (address) updateBalance(address, id);
      };

      provider.on?.('accountsChanged', handleAccountsChanged);
      provider.on?.('chainChanged', handleChainChanged);

      return () => {
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
        provider.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  const updateChainAndBalance = async (acc: string) => {
    const provider = getInjectedProvider();
    if (!provider) return;
    try {
      const cIdHex = await provider.request({ method: 'eth_chainId' });
      const id = parseInt(cIdHex, 16);
      setChainId(id);
      await updateBalance(acc, id);
    } catch (err: any) {
      console.warn('Failed to get chain/balance:', err);
    }
  };

  const updateBalance = async (acc: string, currentChain: number) => {
    const provider = getInjectedProvider();
    if (!provider) return;
    try {
      const balHex = await provider.request({
        method: 'eth_getBalance',
        params: [acc, 'latest']
      });
      const wei = BigInt(balHex);
      const ethVal = (Number(wei / BigInt(10 ** 14)) / 10000).toFixed(4);
      const symbol = currentChain === MST_NETWORKS.mainnet.chainIdDec ? 'MSTC' : 'tMSTC';
      setBalance(`${ethVal} ${symbol}`);
    } catch {
      setBalance('0.0000 tMSTC');
    }
  };

  const connectWallet = async () => {
    setError(null);
    setIsConnecting(true);

    const provider = getInjectedProvider();
    if (!provider) {
      setIsConnecting(false);
      setIsModalOpen(true);
      return;
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await updateChainAndBalance(accounts[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Connection rejected by user.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance(null);
  };

  const switchNetwork = async (target: 'testnet' | 'mainnet'): Promise<boolean> => {
    setError(null);
    const provider = getInjectedProvider();
    if (!provider) {
      setIsModalOpen(true);
      return false;
    }

    const net = MST_NETWORKS[target];

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: net.chainIdHex }]
      });
      setChainId(net.chainIdDec);
      if (address) await updateBalance(address, net.chainIdDec);
      return true;
    } catch (switchError: any) {
      // 4902 means the chain has not been added to the wallet yet
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: net.chainIdHex,
                chainName: net.name,
                nativeCurrency: {
                  name: net.symbol,
                  symbol: net.symbol,
                  decimals: 18
                },
                rpcUrls: [net.rpcUrl],
                blockExplorerUrls: [net.explorerUrl]
              }
            ]
          });
          setChainId(net.chainIdDec);
          return true;
        } catch (addError: any) {
          setError(`Failed to register ${net.name} in wallet: ${addError.message}`);
          return false;
        }
      } else {
        setError(`Failed to switch to ${net.name}: ${switchError.message}`);
        return false;
      }
    }
  };

  const anchorWithWallet = async (eventId: string, hashHex: string) => {
    if (!isConnected || !address) {
      setIsModalOpen(true);
      throw new Error('Please connect your BridgeKey or Web3 wallet first.');
    }

    const provider = getInjectedProvider();
    if (!provider) throw new Error('No BridgeKey or Web3 wallet provider detected.');

    // Ensure we are on MST Testnet
    if (chainId !== MST_NETWORKS.testnet.chainIdDec) {
      const switched = await switchNetwork('testnet');
      if (!switched) {
        throw new Error('Please switch to MST Testnet (Chain ID 91562037) to anchor evidence.');
      }
    }

    const targetContract = MST_NETWORKS.testnet.contractAddress;
    const callData = encodeRecordEvidence(eventId, hashHex);

    try {
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: address,
            to: targetContract,
            data: callData,
            gas: '0x30D40', // 200,000 gas limit
          }
        ]
      });

      return {
        transactionHash: txHash as string,
        explorerUrl: `${MST_NETWORKS.testnet.explorerUrl}/tx/${txHash}`
      };
    } catch (txErr: any) {
      throw new Error(txErr.message || 'Transaction rejected or reverted by node.');
    }
  };

  const deployWithWallet = async () => {
    if (!isConnected || !address) {
      setIsModalOpen(true);
      throw new Error('Please connect your BridgeKey or Web3 wallet first.');
    }

    const provider = getInjectedProvider();
    if (!provider) throw new Error('No BridgeKey or Web3 wallet provider detected.');

    // Ensure we are on MST Testnet
    if (chainId !== MST_NETWORKS.testnet.chainIdDec) {
      const switched = await switchNetwork('testnet');
      if (!switched) {
        throw new Error('Please switch to MST Testnet (Chain ID 91562037) to deploy.');
      }
    }

    try {
      // Send contract creation transaction (to is undefined for deployment)
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: address,
            data: EVIDENCE_REGISTRY_BYTECODE,
            gas: '0x1E8480', // 2,000,000 gas limit (deployment consumes ~970k gas)
          }
        ]
      });

      // Poll for receipt on MST Testnet RPC
      let receipt: any = null;
      const startTime = Date.now();
      const rpcUrl = MST_NETWORKS.testnet.rpcUrl;

      while (!receipt && Date.now() - startTime < 60000) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'eth_getTransactionReceipt',
              params: [txHash]
            })
          });
          const json = await res.json();
          if (json.result) {
            receipt = json.result;
          }
        } catch {
          // retry
        }
      }

      if (!receipt) {
        throw new Error(`Deployment transaction submitted (${txHash}), but receipt confirmation timed out. Check ${MST_NETWORKS.testnet.explorerUrl}/tx/${txHash}`);
      }

      if (receipt.status !== '0x1') {
        throw new Error(`Deployment transaction reverted on MST Testnet (tx: ${txHash}).`);
      }

      const deployedAddr = receipt.contractAddress;
      const blockNum = parseInt(receipt.blockNumber, 16);

      // Verify runtime bytecode on-chain
      const codeRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'eth_getCode',
          params: [deployedAddr, 'latest']
        })
      });
      const codeJson = await codeRes.json();
      if (!codeJson.result || codeJson.result === '0x') {
        throw new Error(`Verification failed: No runtime bytecode found at ${deployedAddr}`);
      }

      return {
        transactionHash: txHash as string,
        contractAddress: deployedAddr as string,
        explorerUrl: `${MST_NETWORKS.testnet.explorerUrl}/address/${deployedAddr}`,
        blockNumber: blockNum
      };
    } catch (err: any) {
      throw new Error(err.message || 'Deployment transaction rejected or failed.');
    }
  };

  // Determine active network config
  const activeNetwork = 
    chainId === MST_NETWORKS.testnet.chainIdDec 
      ? MST_NETWORKS.testnet 
      : (chainId === MST_NETWORKS.mainnet.chainIdDec ? MST_NETWORKS.mainnet : null);

  const isCorrectNetwork = chainId === MST_NETWORKS.testnet.chainIdDec;

  return (
    <Web3WalletContext.Provider
      value={{
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
        anchorWithWallet,
        deployWithWallet,
        isModalOpen,
        setIsModalOpen
      }}
    >
      {children}
    </Web3WalletContext.Provider>
  );
}

export function useWeb3Wallet() {
  const context = useContext(Web3WalletContext);
  if (!context) {
    throw new Error('useWeb3Wallet must be used within a Web3WalletProvider');
  }
  return context;
}
