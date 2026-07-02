"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileSearch, FolderOpen, History,
  BarChart3, Settings, Scale, Github, LogOut, Menu, X,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useLanguage, type DictKey } from "@/lib/i18n";
import { GITHUB_REPO_URL } from "@/lib/constants";

const NAV: { icon: typeof LayoutDashboard; key: DictKey; href: string; requiresWallet: boolean }[] = [
  { icon: LayoutDashboard, key: "nav.dashboard",  href: "/dashboard",            requiresWallet: false },
  { icon: FileSearch,      key: "nav.analyze",    href: "/dashboard/analyze",    requiresWallet: true  },
  { icon: FolderOpen,      key: "nav.documents",  href: "/dashboard/documents",  requiresWallet: false },
  { icon: History,         key: "nav.history",    href: "/dashboard/history",    requiresWallet: false },
  { icon: BarChart3,       key: "nav.analytics",  href: "/dashboard/analytics",  requiresWallet: false },
  { icon: Settings,        key: "nav.settings",   href: "/dashboard/settings",   requiresWallet: false },
];

function NavItems({
  onNavigate,
  onDisconnectClick,
}: {
  onNavigate?: () => void;
  onDisconnectClick: () => void;
}) {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const { t } = useLanguage();

  return (
    <>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ icon: Icon, key, href, requiresWallet }) => {
          const active = pathname === href;
          const locked = requiresWallet && !isConnected;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={locked ? "Connect your wallet to unlock this section" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                active
                  ? "bg-accent-gradient text-white shadow-glow"
                  : locked
                  ? "text-white/30 hover:bg-white/5 hover:text-white/50"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key)}
              {locked && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/20" />}
            </Link>
          );
        })}

        {isConnected && (
          <button
            onClick={() => { onNavigate?.(); onDisconnectClick(); }}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/40 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.disconnect")}
          </button>
        )}
      </nav>

      <div className="mt-auto space-y-3 px-2">
        <Link href="/#why" onClick={onNavigate} className="block text-xs text-white/35 transition hover:text-white/60">
          {t("nav.about")}
        </Link>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>
    </>
  );
}

export function Sidebar({ onDisconnectClick }: { onDisconnectClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 sticky top-0 flex-col border-r border-white/5 bg-bg-panel/60 px-4 py-6">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-gradient">
            <Scale className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight">GenLegal AI</span>
        </Link>
        <NavItems onDisconnectClick={onDisconnectClick} />
      </aside>

      {/* ── Mobile hamburger button (injected into header by layout) ────── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-bg-panel/90 backdrop-blur lg:hidden"
      >
        <Menu className="h-4.5 w-4.5 text-white/70" />
      </button>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-bg-panel px-4 py-6 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient">
              <Scale className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">GenLegal AI</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavItems onNavigate={() => setMobileOpen(false)} onDisconnectClick={onDisconnectClick} />
      </aside>
    </>
  );
}
