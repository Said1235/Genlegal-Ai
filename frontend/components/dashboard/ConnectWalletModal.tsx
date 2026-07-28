"use client";
import { useState } from "react";
import { X, Loader2, Wallet, AlertCircle } from "lucide-react";
import { Scale } from "lucide-react";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { cx } from "@/lib/utils";

export function ConnectWalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connectWallet, isLoading, error } = useWallet();
  const [localError, setLocalError] = useState<string | null>(null);

  if (!open) return null;

  const handleConnect = async () => {
    setLocalError(null);
    // Detect if MetaMask is available — AdBlock or privacy extensions may suppress window.ethereum
    if (typeof window !== "undefined" && !window.ethereum) {
      setLocalError("MetaMask not detected. If you have an ad-blocker or privacy extension active, try disabling it for this page and refresh, then connect again.");
      return;
    }
    try {
      await connectWallet();
      onClose();
    } catch (err: any) {
      // Error already surfaces via WalletProvider.error; show it locally too
      setLocalError(err?.message || "Failed to connect wallet.");
    }
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-bg-panel shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <button onClick={onClose} className="absolute right-4 top-4 text-white/30 transition hover:text-white"><X className="h-4 w-4" /></button>

        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-bold">Connect Wallet</h2>
          <p className="mt-1.5 text-sm text-white/50">Connect to GenLayer studionet to analyze contracts and websites.</p>
        </div>

        <div className="space-y-3 px-6 pb-6">
          {displayError && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-3 text-xs text-rose-300 ring-1 ring-rose-500/25">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <button onClick={handleConnect} disabled={isLoading}
            className={cx("flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",
              "border-accent/30 bg-accent/5 hover:border-accent/50 hover:bg-accent/10",
              isLoading && "opacity-70")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-orange-400" /> : (
                <svg viewBox="0 0 40 40" className="h-7 w-7" fill="none">
                  <path d="M36.5 4L22.5 14.1l2.6-6.1L36.5 4z" fill="#E17726"/>
                  <path d="M3.5 4l13.9 10.2-2.5-6.2L3.5 4z" fill="#E27625"/>
                  <path d="M31.3 27.4l-3.7 5.7 7.9 2.2 2.3-7.7-6.5-.2z" fill="#E27625"/>
                  <path d="M2.2 27.6l2.2 7.7 7.9-2.2-3.7-5.7-6.4.2z" fill="#E27625"/>
                  <path d="M11.9 18.3l-2.2 3.3 7.8.4-.3-8.4-5.3 4.7z" fill="#E27625"/>
                  <path d="M28.1 18.3l-5.4-4.8-.2 8.5 7.8-.4-2.2-3.3z" fill="#E27625"/>
                  <path d="M12.3 33.1l4.7-2.3-4.1-3.2-.6 5.5z" fill="#E27625"/>
                  <path d="M23 30.8l4.7 2.3-.5-5.5-4.2 3.2z" fill="#E27625"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">MetaMask</p>
              <p className="text-xs text-white/45">Connect via MetaMask (EIP-1193). StudioNet is gasless — no ETH needed.</p>
            </div>
          </button>

          <p className="text-center text-[11px] text-white/30 px-2">
            Don't have MetaMask?{" "}
            <a href="https://metamask.io" target="_blank" rel="noreferrer" className="text-accent-light hover:underline">Install it here →</a>
          </p>

          <button onClick={onClose} className="w-full pt-1 text-xs text-white/35 transition hover:text-white/60">Cancel</button>
        </div>
      </div>
    </div>
  );
}
