"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Globe, FolderOpen, History, BarChart3, Settings, Scale, Github, LogOut, Menu, X, ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useLanguage, type DictKey } from "@/lib/i18n";
import { GITHUB_REPO_URL } from "@/lib/constants";

const ANALYZE_CHILDREN = [
  { href: "/dashboard/analyze/smart-contract", label: "Contract Analysis", icon: FileText },
  { href: "/dashboard/analyze/url", label: "URL Reputation", icon: Globe },
];

const NAV: { icon: any; key: DictKey; href: string; requiresWallet: boolean; children?: typeof ANALYZE_CHILDREN }[] = [
  { icon: LayoutDashboard, key: "nav.dashboard", href: "/dashboard", requiresWallet: false },
  { icon: FileText, key: "nav.analyze", href: "/dashboard/analyze", requiresWallet: false, children: ANALYZE_CHILDREN },
  { icon: FolderOpen, key: "nav.documents", href: "/dashboard/documents", requiresWallet: false },
  { icon: History, key: "nav.history", href: "/dashboard/history", requiresWallet: false },
  { icon: BarChart3, key: "nav.analytics", href: "/dashboard/analytics", requiresWallet: false },
  { icon: Settings, key: "nav.settings", href: "/dashboard/settings", requiresWallet: false },
];

function NavItems({ onNavigate, onDisconnectClick }: { onNavigate?: () => void; onDisconnectClick: () => void }) {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const { t } = useLanguage();
  const analyzeOpen = pathname.startsWith("/dashboard/analyze");
  const [expanded, setExpanded] = useState(analyzeOpen);
  useEffect(() => { if (analyzeOpen) setExpanded(true); }, [analyzeOpen]);

  return (
    <>
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ icon: Icon, key, href, requiresWallet, children }) => {
          const active = children ? analyzeOpen : pathname === href;
          const locked = requiresWallet && !isConnected;
          return (
            <div key={href}>
              {children ? (
                <button onClick={() => setExpanded((o) => !o)}
                  className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                    active ? "bg-accent-gradient text-white shadow-glow" : "text-white/55 hover:bg-white/5 hover:text-white")}>
                  <Icon className="h-4 w-4 shrink-0" />{t(key)}
                  <ChevronDown className={cx("ml-auto h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-180")} />
                </button>
              ) : (
                <Link href={href} onClick={onNavigate}
                  className={cx("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-accent-gradient text-white shadow-glow" : locked ? "text-white/30" : "text-white/55 hover:bg-white/5 hover:text-white")}>
                  <Icon className="h-4 w-4 shrink-0" />{t(key)}
                  {locked && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/20" />}
                </Link>
              )}
              {children && expanded && (
                <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-white/8 pl-3">
                  {children.map(({ href: ch, label, icon: ChIcon }) => (
                    <Link key={ch} href={ch} onClick={onNavigate}
                      className={cx("flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition",
                        pathname === ch ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/5 hover:text-white")}>
                      <ChIcon className="h-3.5 w-3.5 shrink-0" />{label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isConnected && (
          <button onClick={() => { onNavigate?.(); onDisconnectClick(); }}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/40 transition hover:bg-rose-500/10 hover:text-rose-300">
            <LogOut className="h-4 w-4" />{t("nav.disconnect")}
          </button>
        )}
      </nav>
      <div className="mt-auto space-y-3 px-2">
        <Link href="/#why" onClick={onNavigate} className="block text-xs text-white/35 transition hover:text-white/60">{t("nav.about")}</Link>
        <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white">
          <Github className="h-3.5 w-3.5" />GitHub
        </a>
      </div>
    </>
  );
}

export function Sidebar({ onDisconnectClick }: { onDisconnectClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  return (
    <>
      <aside className="hidden lg:flex h-screen w-60 shrink-0 sticky top-0 flex-col border-r border-white/5 bg-bg-panel/60 px-4 py-6">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-gradient"><Scale className="h-3.5 w-3.5 text-white" /></span>
          <span className="text-sm font-semibold tracking-tight">GenLegal AI</span>
        </Link>
        <NavItems onDisconnectClick={onDisconnectClick} />
      </aside>
      <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-bg-panel/90 backdrop-blur lg:hidden">
        <Menu className="h-4.5 w-4.5 text-white/70" />
      </button>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cx("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-bg-panel px-4 py-6 transition-transform duration-300 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient"><Scale className="h-3.5 w-3.5 text-white" /></span>
            <span className="text-sm font-semibold tracking-tight">GenLegal AI</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <NavItems onNavigate={() => setMobileOpen(false)} onDisconnectClick={onDisconnectClick} />
      </aside>
    </>
  );
}
