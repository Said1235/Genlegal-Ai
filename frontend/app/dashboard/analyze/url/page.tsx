"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, AlertCircle, Search, Copy, Download, ExternalLink, CheckCircle2, Hash, Wallet as WalletIcon, Clock, BadgeCheck, RotateCcw, ShieldAlert, ShieldQuestion, ShieldCheck, FolderOpen } from "lucide-react";
import { WalletGate } from "@/components/dashboard/WalletGate";
import { useUrlAnalysis } from "@/lib/analysisStateContext";
import { useAnalyzeUrl } from "@/lib/hooks/useUrlReputationOracle";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { useNotificationSettings } from "@/lib/notifications";
import { explorerTxUrl, explorerContractUrl, URL_ORACLE_ADDRESS } from "@/lib/constants";
import { GENLAYER_CHAIN } from "@/lib/genlayer/client";
import { reputationColor, reputationBadgeClass, reputationLabel, type UrlReputation, formatAddress, truncateHash, copyToClipboard, downloadJson, cx } from "@/lib/utils";

const STEPS = ["Sending transaction to GenLayer…","Waiting for blockchain consensus…","AI is checking URL reputation…","Analyzing domain patterns…","Running security scan…","Generating report…"];

export default function UrlAnalysisPage() {
  const { isConnected, address } = useWallet();
  const ctx = useUrlAnalysis();
  if (!isConnected) return (<div className="space-y-6"><Header /><WalletGate feature="URL Reputation Analysis" /></div>);
  if (ctx.view === "analyzing") return <AnalyzingScreen ctx={ctx} />;
  if (ctx.view === "results" && ctx.result) return <ResultsScreen ctx={ctx} walletAddress={address!} />;
  return <div className="space-y-6"><Header /><UrlForm ctx={ctx} /></div>;
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400"><Globe className="h-4 w-4" /></div>
        <h1 className="text-xl font-bold tracking-tight">Website Reputation Analysis</h1>
      </div>
      <p className="text-sm text-white/40">Detect phishing, malware, and other threat indicators via GenLayer's URL Reputation Oracle.</p>
    </div>
  );
}

function UrlForm({ ctx }: { ctx: ReturnType<typeof useUrlAnalysis> }) {
  const { submit } = useAnalyzeUrl();
  const { showToast } = useToast();
  const { isEnabled } = useNotificationSettings();
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErr(null);
    const trimmed = url.trim();
    if (!trimmed) { setErr("Please enter a URL."); return; }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) { setErr("URL must start with http:// or https://"); return; }
    try {
      let step = 0;
      ctx.setStatusText(STEPS[0]); ctx.setView("analyzing");
      if (isEnabled("transaction")) showToast("Transaction submitted – waiting for consensus…", "info");
      const stepTimer = setInterval(() => { step = Math.min(step+1, STEPS.length-1); ctx.setStatusText(STEPS[step]); }, 3000);
      const entry = await submit(trimmed);
      clearInterval(stepTimer);
      if (isEnabled("analysisCompleted")) showToast("URL analysis complete – stored on GenLayer.", "success");
      ctx.setResult(entry); ctx.setView("results");
    } catch (e: any) {
      showToast(e?.message || "Failed to analyze URL.", "error"); ctx.setView("form");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="rounded-2xl border border-white/10 bg-bg-card/60 p-6">
        <label className="mb-2 block text-sm font-medium text-white/70">Enter URL to analyze</label>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-white/10 bg-bg-panel/60 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none" />
        </div>
        {err && <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 ring-1 ring-rose-500/30"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{err}</div>}
        <button onClick={handleSubmit} className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-accent py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          <Search className="h-4 w-4" />Analyze URL
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {["Phishing detection","Malware detection","Reputation score (0–100)","Risk indicators & AI summary"].map((f) => (
          <div key={f} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-bg-card/40 px-4 py-3 text-sm text-white/60"><ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />{f}</div>
        ))}
      </div>
    </div>
  );
}

function AnalyzingScreen({ ctx }: { ctx: ReturnType<typeof useUrlAnalysis> }) {
  const [si, setSi] = useState(0);
  useEffect(() => { const id = setInterval(() => setSi((i) => Math.min(i+1,STEPS.length-1)), 3000); return () => clearInterval(id); }, []);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90 animate-spin" style={{ animationDuration:"3s" }} viewBox="0 0 96 96">
          <circle cx={48} cy={48} r={42} stroke="rgba(6,182,212,0.15)" strokeWidth={6} fill="none" />
          <circle cx={48} cy={48} r={42} stroke="#06b6d4" strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={`${2*Math.PI*42*0.7} ${2*Math.PI*42*0.3}`} />
        </svg>
        <Globe className="h-8 w-8 text-cyan-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Analyzing URL reputation…</h2>
        <p className="text-sm text-white/50">{ctx.statusText}</p>
        <p className="text-xs text-white/30">Navigating away won't stop the analysis — return anytime.</p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {STEPS.slice(0,si+1).map((step,i) => (
          <div key={i} className="flex items-center gap-2 text-left text-sm">
            <CheckCircle2 className={cx("h-4 w-4 shrink-0", i<si ? "text-cyan-400" : "text-cyan-400 animate-pulse")} />
            <span className={i<si ? "text-white/50" : "text-white/85"}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsScreen({ ctx, walletAddress }: { ctx: ReturnType<typeof useUrlAnalysis>; walletAddress: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { result } = ctx;
  if (!result) return null;
  const { verdict, url, txHash, analyzed_at } = result;
  const rep = verdict.risk_level as UrlReputation;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-bg-card/60 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg width={112} height={112} className="-rotate-90">
                <circle cx={56} cy={56} r={48} stroke="rgba(255,255,255,0.08)" strokeWidth={8} fill="none" />
                <circle cx={56} cy={56} r={48} stroke={reputationColor[rep]} strokeWidth={8} fill="none" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*48} strokeDashoffset={2*Math.PI*48*(1-verdict.reputation_score/100)} style={{ transition:"stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{verdict.reputation_score}</span>
                <span className="text-xs text-white/40">/100</span>
              </div>
            </div>
            <span className={cx("rounded-full px-3 py-1 text-xs font-semibold", reputationBadgeClass[rep])}>{reputationLabel[rep]}</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="break-all text-base font-bold">{url}</h2>
            <p className="mt-0.5 text-xs text-white/40">{new Date(analyzed_at).toLocaleString()}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">{verdict.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {verdict.is_phishing && <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-400">⚠ Phishing</span>}
              {verdict.is_malware && <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-400">⚠ Malware</span>}
              {verdict.is_scam_faucet && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-400">⚠ Scam Faucet</span>}
              {verdict.is_clone && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-400">⚠ Clone Site</span>}
              {verdict.is_official && <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">✓ Official</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Copy, label: "Copy", action: async () => { await copyToClipboard(JSON.stringify(result, null, 2)); showToast("Copied.", "success"); } },
                { icon: Download, label: "Download JSON", action: () => { downloadJson(`url-${Date.now()}.json`, result); showToast("Downloaded.", "success"); } },
                { icon: ExternalLink, label: "Explorer", action: () => window.open(txHash ? explorerTxUrl(txHash) : explorerContractUrl(URL_ORACLE_ADDRESS), "_blank", "noreferrer") },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5"><Icon className="h-3.5 w-3.5" />{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
        <h3 className="mb-3 text-[15px] font-semibold">Technical Information</h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            { icon: Globe, label: "Network", value: GENLAYER_CHAIN.name },
            { icon: BadgeCheck, label: "Status", value: verdict.fetch_error ? "Fetch Error" : "Analyzed", cls: verdict.fetch_error ? "text-amber-400" : "text-emerald-400" },
            { icon: Hash, label: "Trust Score", value: `${verdict.reputation_score}/100` },
            { icon: ShieldCheck, label: "Confidence", value: `${Math.round(parseFloat(verdict.confidence)*100)}%` },
            { icon: Hash, label: "Tx Hash", value: txHash ? truncateHash(txHash) : "Not available", mono: true },
            { icon: Clock, label: "Analyzed At", value: new Date(analyzed_at).toLocaleString() },
            { icon: WalletIcon, label: "Submitted By", value: formatAddress(walletAddress, 8), mono: true },
          ].map(({ icon: Icon, label, value, cls, mono }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="flex shrink-0 items-center gap-1.5 text-white/40"><Icon className="h-3.5 w-3.5" />{label}</span>
              <span className={cx("truncate text-right", mono ? "font-mono text-[12px]" : "", cls || "text-white/80")}>{value}</span>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={ctx.reset} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-accent py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          <RotateCcw className="h-4 w-4" />Analyze Another URL
        </button>
        <button onClick={() => router.push("/dashboard/documents")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-bg-card/60 py-3.5 text-sm font-semibold text-white/80 transition hover:border-accent/40 hover:text-white">
          <FolderOpen className="h-4 w-4" />Go to Documents
        </button>
      </div>
    </div>
  );
}
