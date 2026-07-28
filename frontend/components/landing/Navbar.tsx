"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Scale, Wallet, Loader2, Menu, X } from "lucide-react";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { ConnectWalletModal } from "@/components/dashboard/ConnectWalletModal";
import { formatAddress } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard/analyze", label: "Analyze" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

export function Navbar() {
  const { address, isConnected, isLoading, error, disconnectWallet } = useWallet();
  const { showToast } = useToast();
  const lastErr = useRef<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  useEffect(() => {
    if (error && error !== lastErr.current) { showToast(error, "error"); lastErr.current = error; }
  }, [error, showToast]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gradient">
              <Scale className="h-4 w-4 text-white" strokeWidth={2.25} />
            </span>
            <div>
              <span className="text-[15px] font-semibold tracking-tight">GenLegal AI</span>
              <span className="ml-2 hidden text-xs font-normal text-white/40 sm:inline">Powered by GenLayer</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} className="transition hover:text-white">{l.label}</Link>)}
          </nav>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button onClick={disconnectWallet} title="Click to disconnect"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline">{formatAddress(address)}</span>
              </button>
            ) : (
              <button onClick={() => setConnectOpen(true)} disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-60">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect Wallet
              </button>
            )}
            <button onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 md:hidden">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/10 bg-bg-panel shadow-2xl transition-transform duration-300 md:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient"><Scale className="h-3.5 w-3.5 text-white" /></span>
            <span className="text-sm font-semibold">GenLegal AI</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white">{l.label}</Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/5 p-4">
          {isConnected ? (
            <button onClick={() => { disconnectWallet(); setMobileOpen(false); }}
              className="w-full rounded-xl border border-rose-500/30 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10">Disconnect Wallet</button>
          ) : (
            <button onClick={() => { setConnectOpen(true); setMobileOpen(false); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-gradient py-2.5 text-sm font-semibold text-white shadow-glow">
              <Wallet className="h-4 w-4" />Connect Wallet
            </button>
          )}
        </div>
      </div>

      <ConnectWalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </>
  );
}
