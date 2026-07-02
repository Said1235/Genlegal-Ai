"use client";

import { useRef, useState, useEffect } from "react";
import {
  Sparkles, Loader2, AlertCircle, UploadCloud,
  Copy, Download, ExternalLink, CheckCircle2, XCircle,
  Hash, Wallet as WalletIcon, Clock, Globe, BadgeCheck,
  RotateCcw, ShieldAlert, ShieldCheck, ShieldQuestion,
} from "lucide-react";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { WalletGate } from "@/components/dashboard/WalletGate";
import { ScoreRing } from "@/components/dashboard/ScoreRing";
import { useAnalyzeContract, useContract } from "@/lib/hooks/useLegalContractAnalyzer";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useToast } from "@/lib/toast";
import { useNotificationSettings } from "@/lib/notifications";
import { useLanguage } from "@/lib/i18n";
import { GENLAYER_NETWORK, GENLAYER_CHAIN } from "@/lib/genlayer/client";
import { rememberTxHash } from "@/lib/txCache";
import {
  riskBadgeClass, riskColor, formatAddress, truncateHash,
  copyToClipboard, downloadJson, sha256Hex, cx,
} from "@/lib/utils";
import type { Analysis } from "@/lib/contracts/types";

const CONTRACT_TYPES = ["Service Agreement", "NDA", "Employment Contract", "Lease Agreement", "MSA", "Other"];
const MAX_CHARS = 100_000;
const MIN_CHARS = 20;

type View = "form" | "analyzing" | "results";

interface ResultData {
  analysis: Analysis;
  txHash: string;
  contractHash: string;
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AnalyzeContractPage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();
  const [view, setView] = useState<View>("form");
  const [result, setResult] = useState<ResultData | null>(null);
  const [statusText, setStatusText] = useState("Sending transaction...");

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader t={t} />
        <WalletGate feature="Analyzing a contract" />
      </div>
    );
  }

  if (view === "analyzing") {
    return <AnalyzingScreen statusText={statusText} />;
  }

  if (view === "results" && result) {
    return (
      <ResultsScreen
        result={result}
        walletAddress={address!}
        onNewAnalysis={() => { setResult(null); setView("form"); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader t={t} />
      <AnalyzeForm
        address={address!}
        onAnalyzing={(status) => { setStatusText(status); setView("analyzing"); }}
        onResult={(r) => { setResult(r); setView("results"); }}
        onError={() => setView("form")}
        setStatusText={setStatusText}
      />
    </div>
  );
}

function PageHeader({ t }: { t: (k: any) => string }) {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">{t("analyze.title")}</h1>
      <p className="mt-1 text-sm text-white/40">{t("analyze.subtitle")}</p>
    </div>
  );
}

// ── Form ───────────────────────────────────────────────────────────────────

function AnalyzeForm({
  address,
  onAnalyzing,
  onResult,
  onError,
  setStatusText,
}: {
  address: string;
  onAnalyzing: (status: string) => void;
  onResult: (r: ResultData) => void;
  onError: () => void;
  setStatusText: (s: string) => void;
}) {
  const { submit, isSubmitting } = useAnalyzeContract();
  const contract = useContract();
  const { showToast } = useToast();
  const { isEnabled } = useNotificationSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [text, setText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || "").slice(0, MAX_CHARS));
      if (!title) setTitle(file.name.replace(/\.(txt|md)$/, ""));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setValidationError(null);
    if (!text.trim()) { setValidationError("Please paste a contract first."); return; }
    if (text.trim().length < MIN_CHARS) { setValidationError("The contract appears to be incomplete."); return; }
    if (!title.trim()) { setValidationError("Give this analysis a title (e.g. the contract's name)."); return; }

    try {
      onAnalyzing("Sending transaction to GenLayer...");
      if (isEnabled("transaction")) showToast("Transaction submitted – waiting for consensus…", "info");
      const receipt = await submit(title.trim(), contractType, text.trim());

      setStatusText("AI is analyzing your contract…");
      const [all, contractHash] = await Promise.all([
        contract!.getAllAnalyses(),
        sha256Hex(text.trim()),
      ]);
      const newAnalysis = all[all.length - 1];
      rememberTxHash(newAnalysis.id, receipt.hash);
      if (isEnabled("analysisCompleted")) showToast("Analysis complete – stored on GenLayer.", "success");
      onResult({ analysis: newAnalysis, txHash: receipt.hash, contractHash });
    } catch (err: any) {
      showToast(err?.message || "Failed to analyze contract.", "error");
      onError();
    }
  };

  return (
    <div className="space-y-4">
      {/* Title + type row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Acme Corp Service Agreement"
            className="w-full rounded-lg border border-white/10 bg-bg-card/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Contract Type</label>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-bg-card/60 px-3 py-2.5 text-sm text-white focus:border-accent/50 focus:outline-none"
          >
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-bg-panel">{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload button — prominent, full-width on mobile */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files?.[0] && readFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cx(
            "flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-4 text-sm font-medium transition",
            dragOver
              ? "border-accent bg-accent/10 text-accent-light"
              : "border-white/15 bg-bg-card/40 text-white/60 hover:border-accent/50 hover:bg-accent/5 hover:text-white"
          )}
        >
          <UploadCloud className="h-5 w-5" />
          <span>Upload contract file (.txt)</span>
          <span className="ml-1 text-xs text-white/30">or drag &amp; drop</span>
        </button>
      </div>

      {/* Editor */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-white/50">Or paste contract text</label>
          <span className="text-[11px] text-white/30">{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</span>
        </div>
        <CodeEditor value={text} onChange={setText} placeholder="Paste your contract text here..." minHeight={320} />
      </div>

      {validationError && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 ring-1 ring-rose-500/30">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {validationError}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-gradient py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50 sm:py-3"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Analyze Contract
      </button>
    </div>
  );
}

// ── Analyzing screen ───────────────────────────────────────────────────────

const ANALYSIS_STEPS = [
  "Sending transaction to GenLayer…",
  "Waiting for blockchain confirmation…",
  "AI is analyzing your contract…",
  "Extracting clauses and obligations…",
  "Scanning for risks…",
  "Generating report…",
];

function AnalyzingScreen({ statusText }: { statusText: string }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, ANALYSIS_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center">
      {/* Animated ring */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90 animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 96 96">
          <circle cx={48} cy={48} r={42} stroke="rgba(139,92,246,0.15)" strokeWidth={6} fill="none" />
          <circle
            cx={48} cy={48} r={42}
            stroke="#8b5cf6" strokeWidth={6} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42 * 0.7} ${2 * Math.PI * 42 * 0.3}`}
          />
        </svg>
        <Sparkles className="h-8 w-8 text-accent-light" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Analyzing contract…</h2>
        <p className="text-sm text-white/50">{statusText || ANALYSIS_STEPS[stepIdx]}</p>
        <p className="text-xs text-white/30">This may take a few seconds while GenLayer validators reach consensus.</p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {ANALYSIS_STEPS.slice(0, stepIdx + 1).map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-left text-sm">
            <CheckCircle2 className={cx("h-4 w-4 shrink-0", i < stepIdx ? "text-emerald-400" : "text-accent-light animate-pulse")} />
            <span className={i < stepIdx ? "text-white/50" : "text-white/85"}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Results screen ─────────────────────────────────────────────────────────

function ResultsScreen({
  result,
  walletAddress,
  onNewAnalysis,
}: {
  result: ResultData;
  walletAddress: string;
  onNewAnalysis: () => void;
}) {
  const { analysis, txHash, contractHash } = result;
  const { showToast } = useToast();
  const explorerBase = GENLAYER_NETWORK.blockExplorerUrls[0];

  const handleCopy = async () => {
    await copyToClipboard(JSON.stringify(analysis, null, 2));
    showToast("Analysis copied to clipboard.", "success");
  };
  const handleDownload = () => {
    downloadJson(`analysis-${analysis.id}.json`, { ...analysis, txHash, contractHash });
    showToast("Downloaded analysis.json", "success");
  };

  const RiskIcon = analysis.risk_level === "High" ? ShieldAlert : analysis.risk_level === "Medium" ? ShieldQuestion : ShieldCheck;
  const riskIconColor = analysis.risk_level === "High" ? "text-rose-400" : analysis.risk_level === "Medium" ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="space-y-5">
      {/* ── Hero result card — always first, always visible ── */}
      <div className="rounded-2xl border border-white/10 bg-bg-card/60 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg width={112} height={112} className="-rotate-90">
                <circle cx={56} cy={56} r={48} stroke="rgba(255,255,255,0.08)" strokeWidth={8} fill="none" />
                <circle
                  cx={56} cy={56} r={48}
                  stroke={riskColor[analysis.risk_level]}
                  strokeWidth={8} fill="none" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - analysis.risk_score / 100)}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{analysis.risk_score}</span>
                <span className="text-xs text-white/40">/100</span>
              </div>
            </div>
            <span className={cx("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", riskBadgeClass[analysis.risk_level])}>
              <RiskIcon className={cx("h-3.5 w-3.5", riskIconColor)} />
              {analysis.risk_level} Risk
            </span>
          </div>

          {/* Summary */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold">{analysis.title}</h2>
            <p className="mt-0.5 text-xs text-white/40">{analysis.contract_type} · Analyzed {new Date(analysis.created_at).toLocaleString()}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">{analysis.summary}</p>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionBtn icon={Copy} label="Copy Analysis" onClick={handleCopy} />
              <ActionBtn icon={Download} label="Download JSON" onClick={handleDownload} />
              {explorerBase && txHash ? (
                <a
                  href={`${explorerBase}/tx/${txHash}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Transaction
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ── Obligations + Risks ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Obligations
          </h3>
          {analysis.obligations.length === 0 ? (
            <p className="text-sm text-white/40">No specific obligations extracted.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.obligations.map((o, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
            <XCircle className="h-4 w-4 text-rose-400" />
            Risks Identified
          </h3>
          {analysis.risks.length === 0 ? (
            <p className="text-sm text-white/40">No specific risks flagged.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Technical info ── */}
      <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
        <h3 className="mb-3 text-[15px] font-semibold">Technical Information</h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <InfoRow icon={Globe} label="Blockchain" value={GENLAYER_CHAIN.name} />
          <InfoRow icon={BadgeCheck} label="Status" value="Completed" valueClass="text-emerald-400" />
          <InfoRow icon={Hash} label="Contract Hash" value={truncateHash(contractHash)} mono />
          <InfoRow icon={Hash} label="Transaction Hash" value={txHash ? truncateHash(txHash) : "Not available"} mono />
          <InfoRow icon={Clock} label="Timestamp" value={new Date(analysis.created_at).toLocaleString()} />
          <InfoRow icon={WalletIcon} label="Wallet" value={formatAddress(walletAddress, 8)} mono />
        </dl>
      </div>

      {/* ── New analysis CTA — always visible at bottom ── */}
      <button
        onClick={onNewAnalysis}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-accent-gradient py-4 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        <RotateCcw className="h-4 w-4" />
        Scan a New Contract
      </button>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, mono, valueClass }: {
  icon: typeof Hash; label: string; value: string; mono?: boolean; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 shrink-0 text-white/40">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={cx(
        "truncate text-right",
        mono ? "font-mono text-[12px]" : "",
        valueClass || "text-white/80"
      )}>
        {value}
      </span>
    </div>
  );
}
