import Link from "next/link";
import { Scale, Github, Twitter } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/5 bg-bg-panel/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient">
                <Scale className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-semibold">GenLegal AI</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              AI-powered legal analysis on blockchain. Understand contracts, avoid risks.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Product</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/dashboard/analyze"   className="transition hover:text-white">Analyze</Link></li>
              <li><Link href="/dashboard/documents" className="transition hover:text-white">Documents</Link></li>
              <li><Link href="/dashboard/history"   className="transition hover:text-white">History</Link></li>
              <li><Link href="/dashboard/analytics" className="transition hover:text-white">Analytics</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Resources</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" className="transition hover:text-white">GenLayer Docs</a></li>
              <li><Link href="/#faq" className="transition hover:text-white">FAQ</Link></li>
              <li><a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Connect</h4>
            <div className="flex gap-3 text-white/40">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-white/30">© {year} GenLegal AI. All rights reserved.</p>
          <p className="text-xs text-white/20">Built on <span className="text-accent-light">GenLayer</span></p>
        </div>
      </div>
    </footer>
  );
}
