import Link from "next/link";
import { Scale, Github, Twitter } from "lucide-react";
import { GITHUB_REPO_URL, APP_VERSION } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-bg-panel/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient">
                <Scale className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-semibold">GenLegal AI</span>
            </div>
            <p className="text-xs leading-relaxed text-white/40 max-w-[240px]">
              GenLegal AI combines AI-powered analysis and decentralized consensus to help users evaluate smart contracts and website reputation from a single, unified interface.
            </p>
            <div className="mt-4 flex gap-3 text-white/30">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="transition hover:text-white"><Twitter className="h-4 w-4" /></a>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="transition hover:text-white"><Github className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Product</h4>
            <ul className="space-y-2 text-sm text-white/50">
              {[["Analyze","/dashboard/analyze"],["Documents","/dashboard/documents"],["History","/dashboard/history"],["Analytics","/dashboard/analytics"]].map(([l,h]) => (
                <li key={h}><Link href={h} className="transition hover:text-white">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Resources</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" className="transition hover:text-white">GenLayer Docs</a></li>
              <li><Link href="/#faq" className="transition hover:text-white">FAQ</Link></li>
              <li><a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Company</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/#why" className="transition hover:text-white">About</Link></li>
              <li><span className="text-white/30">Privacy Policy</span></li>
              <li><span className="text-white/30">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} GenLegal AI. All rights reserved.</p>
          <p className="text-xs text-white/20">v{APP_VERSION} · Built on <span className="text-accent-light">GenLayer</span></p>
        </div>
      </div>
    </footer>
  );
}
