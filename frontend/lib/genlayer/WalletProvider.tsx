"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  isMetaMaskInstalled,
  connectWalletFlow,
  getAccounts,
  getCurrentChainId,
  isOnGenLayerNetwork,
} from "./client";

const DISCONNECT_FLAG = "genlegal_wallet_disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
  error: string | null;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isLoading: true,
    isMetaMaskInstalled: false,
    isOnCorrectNetwork: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const installed = isMetaMaskInstalled();
      if (!installed) {
        if (mounted) setState((s) => ({ ...s, isLoading: false, isMetaMaskInstalled: false }));
        return;
      }
      const wasDisconnected =
        typeof window !== "undefined" && localStorage.getItem(DISCONNECT_FLAG) === "true";
      if (wasDisconnected) {
        if (mounted) setState((s) => ({ ...s, isLoading: false, isMetaMaskInstalled: true }));
        return;
      }
      const accounts = await getAccounts();
      const chainId = await getCurrentChainId();
      const correct = await isOnGenLayerNetwork();
      if (mounted) {
        setState({
          address: accounts[0] || null,
          chainId,
          isConnected: accounts.length > 0,
          isLoading: false,
          isMetaMaskInstalled: true,
          isOnCorrectNetwork: correct,
          error: null,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const provider = window.ethereum;

    const handleAccountsChanged = async (accounts: string[]) => {
      const correct = await isOnGenLayerNetwork();
      if (accounts.length > 0) localStorage.removeItem(DISCONNECT_FLAG);
      setState((s) => ({ ...s, address: accounts[0] || null, isConnected: accounts.length > 0, isOnCorrectNetwork: correct }));
    };
    const handleChainChanged = async (chainId: string) => {
      const correct = await isOnGenLayerNetwork();
      setState((s) => ({ ...s, chainId, isOnCorrectNetwork: correct }));
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const address = await connectWalletFlow();
      const chainId = await getCurrentChainId();
      const correct = await isOnGenLayerNetwork();
      if (typeof window !== "undefined") localStorage.removeItem(DISCONNECT_FLAG);
      setState({
        address,
        chainId,
        isConnected: true,
        isLoading: false,
        isMetaMaskInstalled: true,
        isOnCorrectNetwork: correct,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({ ...s, isLoading: false, error: err?.message || "Failed to connect wallet" }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(DISCONNECT_FLAG, "true");
    setState((s) => ({ ...s, address: null, isConnected: false }));
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
