"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, Wallet, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DisconnectModal } from "@/components/dashboard/DisconnectModal";
import { ConnectWalletModal } from "@/components/dashboard/ConnectWalletModal";
import { AnalysisStateProvider } from "@/lib/analysisStateContext";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n";
import { formatAddress } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isLoading, disconnectWallet } = useWallet();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const handleConfirmDisconnect = () => {
    try { disconnectWallet(); setDisconnectOpen(false); showToast("Wallet disconnected.", "success"); router.push("/"); }
    catch { showToast("Unable to disconnect wallet.", "error"); }
  };

  return (
    <AnalysisStateProvider>
      <div className="flex min-h-screen">
        <Sidebar onDisconnectClick={() => setDisconnectOpen(true)} />
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-4 pl-16 sm:px-6 lg:px-10 lg:pl-10">
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/5 sm:flex">
                <Scale className="h-3.5 w-3.5" />{t("common.home")}
              </Link>
              {isConnected ? (
                <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 sm:px-4">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <span className="max-w-[120px] truncate sm:max-w-none">{formatAddress(address)}</span>
                </span>
              ) : (
                <button onClick={() => setConnectOpen(true)} disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg bg-accent-gradient px-3 py-2 text-xs font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-60 sm:px-4 sm:text-sm">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  <span className="hidden sm:inline">{t("common.connectWallet")}</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-10">{children}</main>
        </div>
        <DisconnectModal open={disconnectOpen} onCancel={() => setDisconnectOpen(false)} onConfirm={handleConfirmDisconnect} />
        <ConnectWalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
      </div>
    </AnalysisStateProvider>
  );
}
