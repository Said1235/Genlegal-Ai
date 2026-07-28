import Link from "next/link";
import { FileText, Globe, CheckCircle2, ArrowRight } from "lucide-react";

export function TwoToolsSection() {
  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What can you analyze?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/50">
            Two complementary AI-powered security tools — one platform.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card/60">
            <div className="flex-1 p-7">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-accent-light">📜 Smart Contract Analysis</div>
              <h3 className="mb-3 text-xl font-bold">Legal & Smart Contract Analysis</h3>
              <p className="text-sm leading-relaxed text-white/55">
                Analyze legal documents and Solidity smart contracts to identify potential risks, summarize contract behavior, inspect source code, and support security reviews with AI-generated insights.
              </p>
              <ul className="mt-5 space-y-2">
                {["Risk detection & scoring","Obligations & clauses extraction","Security vulnerability scanning","Plain language explanations"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/65">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-light" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/dashboard/analyze/smart-contract"
              className="group relative m-5 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-gradient py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <FileText className="h-4 w-4" />Analyze Contract<ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card/60">
            <div className="flex-1 p-7">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-cyan-400">🌐 URL Reputation Analysis</div>
              <h3 className="mb-3 text-xl font-bold">Website Reputation Analysis</h3>
              <p className="text-sm leading-relaxed text-white/55">
                Evaluate websites and domains to detect potential phishing attempts, suspicious behavior, cloned pages, or other indicators that help determine whether a URL appears trustworthy.
              </p>
              <ul className="mt-5 space-y-2">
                {["Reputation & trust score","Phishing & malware detection","Domain & content analysis","Risk indicators and summary"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/65">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/dashboard/analyze/url"
              className="group relative m-5 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-accent py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <Globe className="h-4 w-4" />Analyze URL<ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
