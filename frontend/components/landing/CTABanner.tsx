import Link from "next/link";
import { Scale, FileText, Globe } from "lucide-react";

export function CTABanner() {
  return (
    <section className="border-t border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-bg-card/60 to-bg-card/40 p-8 sm:p-12">
          <div className="pointer-events-none absolute -top-20 right-10 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
            <div className="flex items-start gap-4">
              <div className="hidden lg:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
                <Scale className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Ready to Analyze with Confidence?</h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55">
                  Join thousands of users who trust GenLegal AI for secure, AI-powered analysis of contracts and websites.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <Link href="/dashboard/analyze/smart-contract"
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-accent-gradient px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <FileText className="h-4 w-4" />Analyze a Contract
              </Link>
              <Link href="/dashboard/analyze/url"
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <Globe className="h-4 w-4" />Analyze a URL
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
