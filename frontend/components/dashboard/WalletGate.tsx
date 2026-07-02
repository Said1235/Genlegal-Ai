"use client";

import { Wallet, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/genlayer/WalletProvider";

export function WalletGate({ feature }: { feature: string }) {
  const { connectWallet, isLoading, isMetaMaskInstalled } = useWallet();

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-bg-card/60 p-10 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent-light">
        <Wallet className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold">Connect your wallet to continue</h2>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        {feature} reads and writes data tied to your wallet address, so you'll need to connect first.
      </p>
      <button
        onClick={connectWallet}
        disabled={isLoading}
        className="mt-6 flex items-center gap-2 rounded-xl bg-accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        Connect Wallet
      </button>
      {!isMetaMaskInstalled && (
        <p className="mt-3 text-xs text-white/35">
          No wallet detected - install{" "}
          <a href="https://metamask.io" target="_blank" rel="noreferrer" className="text-accent-light hover:underline">
            MetaMask
          </a>{" "}
          first.
        </p>
      )}
    </div>
  );
}
