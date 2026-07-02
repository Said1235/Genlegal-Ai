"use client";

import { createClient } from "genlayer-js";
import { localnet, studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

// --- GenLayer network configuration -----------------------------------
// Pick the chain genlayer-js actually talks to AND what MetaMask gets
// pointed at from the *same* object, so the two can never drift apart.
// Set NEXT_PUBLIC_GENLAYER_NETWORK to one of: studionet (default, hosted,
// gasless, no Docker needed) | localnet (genlayer up) | testnetAsimov |
// testnetBradbury (both need a funded account from
// https://testnet-faucet.genlayer.foundation/).
const CHAINS: Record<string, GenLayerChain> = {
  studionet,
  localnet,
  testnetAsimov,
  testnetBradbury,
};

const selectedNetworkKey = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet";
export const GENLAYER_CHAIN: GenLayerChain = CHAINS[selectedNetworkKey] ?? studionet;

// Optional override, mainly for localnet users running genlayer up on a
// non-default port. Leave unset to use the chain's built-in RPC URL.
const rpcOverride = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;

export const GENLAYER_CHAIN_ID = GENLAYER_CHAIN.id;
export const GENLAYER_CHAIN_ID_HEX = `0x${GENLAYER_CHAIN_ID.toString(16)}`;

export const GENLAYER_NETWORK = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName: GENLAYER_CHAIN.name,
  nativeCurrency: GENLAYER_CHAIN.nativeCurrency,
  rpcUrls: [rpcOverride || GENLAYER_CHAIN.rpcUrls.default.http[0]],
  blockExplorerUrls: GENLAYER_CHAIN.blockExplorers
    ? [GENLAYER_CHAIN.blockExplorers.default.url]
    : [],
};

export function getContractAddress(): string {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
}

// --- window.ethereum (MetaMask) helpers ---------------------------------
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function isMetaMaskInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.ethereum?.isMetaMask;
}

function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum || null;
}

export async function getAccounts(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) return [];
  try {
    return await provider.request({ method: "eth_accounts" });
  } catch {
    return [];
  }
}

export async function getCurrentChainId(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.request({ method: "eth_chainId" });
  } catch {
    return null;
  }
}

export async function isOnGenLayerNetwork(): Promise<boolean> {
  const chainId = await getCurrentChainId();
  if (!chainId) return false;
  return parseInt(chainId, 16) === GENLAYER_CHAIN_ID;
}

async function addGenLayerNetwork(): Promise<void> {
  const provider = getProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  await provider.request({
    method: "wallet_addEthereumChain",
    params: [GENLAYER_NETWORK],
  });
}

async function switchToGenLayerNetwork(): Promise<void> {
  const provider = getProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await addGenLayerNetwork();
    } else if (err.code === 4001) {
      throw new Error("User rejected switching the network");
    } else {
      throw err;
    }
  }
}

/** Connect MetaMask and make sure it's pointed at the GenLayer network. */
export async function connectWalletFlow(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  const provider = getProvider()!;
  const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("No accounts returned by wallet");

  if (!(await isOnGenLayerNetwork())) {
    await switchToGenLayerNetwork();
  }
  return accounts[0];
}

/** Build a genlayer-js client. Pass the connected wallet address once known
 * so write calls are signed by it; omit it for read-only usage. */
export function createGenLayerClient(address?: string | null) {
  const config: any = { chain: GENLAYER_CHAIN };
  if (address) config.account = address as `0x${string}`;
  return createClient(config);
}
