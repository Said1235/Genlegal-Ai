"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle, UploadCloud, Copy, Download, ExternalLink, CheckCircle2, XCircle, Hash, Wallet as WalletIcon, Clock, Globe, BadgeCheck, RotateCcw, ShieldAlert, ShieldCheck, ShieldQuestion, Code2, ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { WalletGate } from "@/components/dashboard/WalletGate";
import { useContractAnalysis } from "@/lib/analysisStateContext";
import { useAnalyzeContract } from "@/lib/hooks/useLegalContractAnalyzer";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { useNotificationSettings } from "@/lib/notifications";
import { GENLAYER_CHAIN } from "@/lib/genlayer/client";
import { explorerTxUrl, explorerContractUrl } from "@/lib/constants";
import { rememberTxHash } from "@/lib/txCache";
import { storeContractText } from "@/lib/contractTextCache";
import { CONTRACT_MAX_CHARS } from "@/lib/contracts/LegalContractAnalyzer";
import { riskBadgeClass, riskColor, formatAddress, truncateHash, copyToClipboard, downloadJson, sha256Hex, cx } from "@/lib/utils";

const CONTRACT_TYPES = ["Service Agreement","NDA","Employment Contract","Lease Agreement","MSA","Partnership Agreement","Other"];
const MIN_CHARS = 50;
const STEPS = ["Sending transaction to GenLayer…","Waiting for blockchain confirmation…","AI is analyzing the document…","Extracting clauses and obligations…","Identifying risks…","Generating report…"];

export default function ContractAnalysisPage() {
  const { isConnected, address } = useWallet();
  const ctx = useContractAnalysis();

  if (!isConnected) return (<div className="space-y-6"><PageHeader /><WalletGate feature="Contract Analysis" /></div>);
  if (ctx.view === "analyzing") return <AnalyzingScreen ctx={ctx} />;
  if (ctx.view === "results" && ctx.result) return <ResultsScreen ctx={ctx} walletAddress={address!} />;
  return (<div className="space-y-6"><PageHeader /><AnalyzeForm ctx={ctx} /></div>);
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Contract Analysis</h1>
      <p className="mt-1 text-sm text-white/40">
        Paste or upload a legal document. The AI will summarize it, extract obligations, and identify risks — stored on GenLayer.
      </p>
    </div>
  );
}

function AnalyzeForm({ ctx }: { ctx: ReturnType<typeof useContractAnalysis> }) {
  const { submit, isSubmitting } = useAnalyzeContract();
  const { showToast } = useToast();
  const { isEnabled } = useNotificationSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [text, setText] = useState("");
  const [valErr, setValErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || "").slice(0, CONTRACT_MAX_CHARS));
      if (!title) setTitle(file.name.replace(/\.(txt|md)$/, ""));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setValErr(null);
    if (!text.trim()) { setValErr("Please paste a legal document first."); return; }
    if (text.trim().length < MIN_CHARS) { setValErr("The document appears to be incomplete (minimum 50 characters)."); return; }
    if (text.trim().length > CONTRACT_MAX_CHARS) { setValErr(`Document exceeds the ${CONTRACT_MAX_CHARS.toLocaleString()}-character limit.`); return; }
    if (!title.trim()) { setValErr("Give this analysis a title."); return; }
    try {
      ctx.setStatusText(STEPS[0]);
      ctx.setView("analyzing");
      if (isEnabled("transaction")) showToast("Transaction submitted – waiting for consensus…", "info");
      const { txHash, analysis } = await submit(title.trim(), contractType, text.trim());
      rememberTxHash(analysis.id, txHash);
      storeContractText(analysis.id, text.trim());
      if (isEnabled("analysisCompleted")) showToast("Analysis complete – stored on GenLayer.", "success");
      const contractHash = await sha256Hex(text.trim());
      ctx.setResult({ analysis, txHash, contractHash, contractText: text.trim() });
      ctx.setView("results");
    } catch (err: any) {
      showToast(err?.message || "Failed to analyze document.", "error");
      ctx.setView("form");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Document Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Acme Corp Service Agreement"
            className="w-full rounded-lg border border-white/10 bg-bg-card/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Document Type</label>
          <select value={contractType} onChange={(e) => setContractType(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-bg-card/60 px-3 py-2.5 text-sm text-white focus:border-accent/50 focus:outline-none">
            {CONTRACT_TYPES.map((t) => <option key={t} value={t} className="bg-bg-panel">{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <input ref={inputRef} type="file" accept=".txt,.md" className="hidden"
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        <button onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files?.[0] && readFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          className={cx("flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-4 text-sm font-medium transition",
            dragOver ? "border-accent bg-accent/10 text-accent-light" : "border-white/15 bg-bg-card/40 text-white/60 hover:border-accent/50 hover:text-white")}>
          <UploadCloud className="h-5 w-5" />Upload document (.txt) <span className="text-xs text-white/30">or drag & drop</span>
        </button>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-white/50">Or paste document text</label>
          <span className={cx("text-[11px]", text.length > CONTRACT_MAX_CHARS ? "text-rose-400" : "text-white/30")}>
            {text.length.toLocaleString()} / {CONTRACT_MAX_CHARS.toLocaleString()}
          </span>
        </div>
        <CodeEditor value={text} onChange={setText} placeholder="Paste your legal document here..." minHeight={320} />
      </div>
      {valErr && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 ring-1 ring-rose-500/30">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{valErr}
        </div>
      )}
      <button onClick={handleSubmit} disabled={isSubmitting || text.length > CONTRACT_MAX_CHARS}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-gradient py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50">
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Analyze
      </button>
    </div>
  );
}

function AnalyzingScreen({ ctx }: { ctx: ReturnType<typeof useContractAnalysis> }) {
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => { const id = setInterval(() => setStepIdx((i) => Math.min(i+1,STEPS.length-1)), 2200); return () => clearInterval(id); }, []);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90 animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 96 96">
          <circle cx={48} cy={48} r={42} stroke="rgba(139,92,246,0.15)" strokeWidth={6} fill="none" />
          <circle cx={48} cy={48} r={42} stroke="#8b5cf6" strokeWidth={6} fill="none" strokeLinecap="round"
            strokeDasharray={`${2*Math.PI*42*0.7} ${2*Math.PI*42*0.3}`} />
        </svg>
        <Sparkles className="h-8 w-8 text-accent-light" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Analyzing document…</h2>
        <p className="text-sm text-white/50">{ctx.statusText}</p>
        <p className="text-xs text-white/30">Navigating away won't stop the analysis — return anytime to see results.</p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {STEPS.slice(0, stepIdx+1).map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-left text-sm">
            <CheckCircle2 className={cx("h-4 w-4 shrink-0", i < stepIdx ? "text-emerald-400" : "text-accent-light animate-pulse")} />
            <span className={i < stepIdx ? "text-white/50" : "text-white/85"}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsScreen({ ctx, walletAddress }: { ctx: ReturnType<typeof useContractAnalysis>; walletAddress: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { result } = ctx;
  if (!result) return null;
  const { analysis, txHash, contractHash, contractText } = result;
  const [codeOpen, setCodeOpen] = useState(false);
  const RiskIcon = analysis.risk_level === "High" ? ShieldAlert : analysis.risk_level === "Medium" ? ShieldQuestion : ShieldCheck;
  const rIconCls = analysis.risk_level === "High" ? "text-rose-400" : analysis.risk_level === "Medium" ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-bg-card/60 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg width={112} height={112} className="-rotate-90">
                <circle cx={56} cy={56} r={48} stroke="rgba(255,255,255,0.08)" strokeWidth={8} fill="none" />
                <circle cx={56} cy={56} r={48} stroke={riskColor[analysis.risk_level]} strokeWidth={8} fill="none" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*48} strokeDashoffset={2*Math.PI*48*(1-analysis.risk_score/100)} style={{ transition: "stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{analysis.risk_score}</span>
                <span className="text-xs text-white/40">/100</span>
              </div>
            </div>
            <span className={cx("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", riskBadgeClass[analysis.risk_level])}>
              <RiskIcon className={cx("h-3.5 w-3.5", rIconCls)} />{analysis.risk_level} Risk
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold">{analysis.title}</h2>
            <p className="mt-0.5 text-xs text-white/40">{analysis.contract_type} · {new Date(analysis.created_at).toLocaleString()}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">{analysis.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Copy, label: "Copy", action: async () => { await copyToClipboard(JSON.stringify(analysis, null, 2)); showToast("Copied.", "success"); } },
                { icon: Download, label: "Download JSON", action: () => { downloadJson(`analysis-${analysis.id}.json`, { ...analysis, txHash, contractHash }); showToast("Downloaded.", "success"); } },
                { icon: ExternalLink, label: "Explorer", action: () => window.open(txHash ? explorerTxUrl(txHash) : explorerContractUrl(), "_blank", "noreferrer") },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5">
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Obligations", icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, items: analysis.obligations, itemIcon: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />, empty: "No obligations extracted." },
          { title: "Risks Identified", icon: <XCircle className="h-4 w-4 text-rose-400" />, items: analysis.risks, itemIcon: <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />, empty: "No risks flagged." },
        ].map(({ title, icon, items, itemIcon, empty }) => (
          <div key={title} className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">{icon}{title}</h3>
            {items.length === 0 ? <p className="text-sm text-white/40">{empty}</p>
              : <ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">{itemIcon}{item}</li>)}</ul>}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
        <h3 className="mb-3 text-[15px] font-semibold">Technical Information</h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            { icon: Globe, label: "Blockchain", value: GENLAYER_CHAIN.name },
            { icon: BadgeCheck, label: "Status", value: "Completed", cls: "text-emerald-400" },
            { icon: Hash, label: "Doc Hash", value: truncateHash(contractHash), mono: true },
            { icon: Hash, label: "Tx Hash", value: txHash ? truncateHash(txHash) : "Not available", mono: true },
            { icon: Clock, label: "Timestamp", value: new Date(analysis.created_at).toLocaleString() },
            { icon: WalletIcon, label: "Wallet", value: formatAddress(walletAddress, 8), mono: true },
          ].map(({ icon: Icon, label, value, cls, mono }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="flex shrink-0 items-center gap-1.5 text-white/40"><Icon className="h-3.5 w-3.5" />{label}</span>
              <span className={cx("truncate text-right", mono ? "font-mono text-[12px]" : "", cls || "text-white/80")}>{value}</span>
            </div>
          ))}
        </dl>
      </div>
      <div className="dark-surface overflow-hidden rounded-2xl border border-white/8 bg-[#08080f]">
        <button onClick={() => setCodeOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.02]">
          <span className="flex items-center gap-2 text-[15px] font-semibold"><Code2 className="h-4 w-4 text-accent-light" />Document Text</span>
          <span className="flex items-center gap-2 text-xs text-white/40">{codeOpen ? <>Hide<ChevronUp className="h-4 w-4" /></> : <>View<ChevronDown className="h-4 w-4" /></>}</span>
        </button>
        {codeOpen && contractText && (
          <>
            <div className="flex items-center justify-between border-y border-white/5 px-5 py-2.5">
              <span className="text-xs text-white/30">{contractText.split("\n").length} lines</span>
              <button onClick={async () => { await copyToClipboard(contractText); showToast("Copied.", "success"); }}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.07]">
                <Copy className="h-3.5 w-3.5" />Copy Text
              </button>
            </div>
            <div className="flex max-h-72 overflow-y-auto font-mono text-[12px] leading-[1.65rem] scrollbar-thin">
              <div className="select-none border-r border-white/5 px-3 py-3 text-right text-accent-light/35">
                {contractText.split("\n").map((_,i) => <div key={i}>{i+1}</div>)}
              </div>
              <div className="flex-1 overflow-x-auto whitespace-pre px-4 py-3 text-white/75">
                {contractText.split("\n").map((line,i) => <div key={i}>{line||"\u00a0"}</div>)}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={ctx.reset} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-gradient py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          <RotateCcw className="h-4 w-4" />New Analysis
        </button>
        <button onClick={() => router.push("/dashboard/documents")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-bg-card/60 py-3.5 text-sm font-semibold text-white/80 transition hover:border-accent/40 hover:text-white">
          <FolderOpen className="h-4 w-4" />Go to Documents
        </button>
      </div>
    </div>
  );
}
