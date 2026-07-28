"use client";
import Link from "next/link";
import { FileText, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { WalletGate } from "@/components/dashboard/WalletGate";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useContractAnalysis, useUrlAnalysis } from "@/lib/analysisStateContext";

export default function AnalyzePage() {
  const { isConnected } = useWallet();
  const contractCtx = useContractAnalysis();
  const urlCtx = useUrlAnalysis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Analysis</h1>
        <p className="mt-1 text-sm text-white/40">Choose what to analyze. Results are stored on GenLayer.</p>
      </div>
      {!isConnected ? <WalletGate feature="Analysis" /> : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <AnalysisCard
              badge="Legal Documents" badgeColor="text-accent-light"
              title="Contract Analysis"
              description="Analyze legal documents — NDAs, service agreements, employment contracts — to identify key obligations, risks, and relevant clauses using AI-powered insights."
              features={["Risk identification & scoring","Obligations extraction","Clause analysis","Plain language summary"]}
              href="/dashboard/analyze/smart-contract"
              btnLabel={contractCtx.view !== "form" ? "Continue Analysis ↩" : "Analyze Contract"}
              btnClass="bg-accent-gradient"
              icon={<FileText className="h-6 w-6" />}
              iconBg="bg-accent/15 text-accent-light"
              pending={contractCtx.view !== "form"}
            />
            <AnalysisCard
              badge="URL Reputation" badgeColor="text-cyan-400"
              title="Website Reputation Analysis"
              description="Evaluate websites and domains to detect phishing, malware, cloned pages, and other threat indicators before connecting your wallet or interacting with external links."
              features={["Phishing detection","Malware detection","Reputation score","Risk indicators & AI summary"]}
              href="/dashboard/analyze/url"
              btnLabel={urlCtx.view !== "form" ? "Continue Analysis ↩" : "Analyze URL"}
              btnClass="bg-gradient-to-r from-cyan-600 to-accent"
              icon={<Globe className="h-6 w-6" />}
              iconBg="bg-cyan-500/15 text-cyan-400"
              pending={urlCtx.view !== "form"}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/8 bg-bg-card/40 px-5 py-4">
            <p className="text-sm font-semibold">Two Powerful Analysis Engines</p>
            <div className="flex flex-wrap gap-2">
              {["AI-Powered","Blockchain Verified","Decentralized","Secure & Private"].map((l) => (
                <span key={l} className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/50">{l}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AnalysisCard({ badge, badgeColor, title, description, features, href, btnLabel, btnClass, icon, iconBg, pending }: any) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card/60 transition hover:border-white/20">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className={`mb-1 text-[11px] font-semibold uppercase tracking-widest ${badgeColor}`}>{badge}</p>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
        </div>
        <p className="text-sm leading-relaxed text-white/55">{description}</p>
        <ul className="mt-4 space-y-2">
          {features.map((f: string) => (
            <li key={f} className="flex items-center gap-2 text-sm text-white/65">
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${badgeColor}`} />{f}
            </li>
          ))}
        </ul>
        {pending && <div className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/50">Analysis in progress — click below to return</div>}
      </div>
      <Link href={href} className={`group relative m-4 flex items-center justify-center gap-2 overflow-hidden rounded-xl ${btnClass} py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90`}>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        {btnLabel}<ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
