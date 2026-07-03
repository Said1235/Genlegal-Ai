"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, Wallet, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DisconnectModal } from "@/components/dashboard/DisconnectModal";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n";
import { formatAddress } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isLoading, connectWallet, disconnectWallet } = useWallet();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmDisconnect = () => {
    try {
      disconnectWallet();
      setConfirmOpen(false);
      showToast("Wallet disconnected successfully.", "success");
      router.push("/");
    } catch {
      showToast("Unable to disconnect wallet.", "error");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onDisconnectClick={() => setConfirmOpen(true)} />

      <div className="min-w-0 flex-1">
        {/* Header — left padding extra en móvil para dejar espacio al hamburger */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-4 pl-16 sm:px-6 lg:px-10 lg:pl-10">
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/5 sm:flex"
            >
              <Scale className="h-3.5 w-3.5" />
              {t("common.home")}
            </Link>
            {isConnected ? (
              <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 sm:px-4 sm:text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <span className="max-w-[120px] truncate sm:max-w-none">{formatAddress(address)}</span>
              </span>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-accent-gradient px-3 py-2 text-xs font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-60 sm:px-4 sm:text-sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("common.connectWallet")}</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-10">{children}</main>
      </div>

      <DisconnectModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDisconnect}
      />
    </div>
  );
}
