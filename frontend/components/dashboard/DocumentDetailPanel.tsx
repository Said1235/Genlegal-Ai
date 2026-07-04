"use client";

import { useState } from "react";
import {
  FileText, X, Copy, Download, ExternalLink,
  CheckCircle2, XCircle, AlignLeft, ListChecks,
  AlertTriangle, Tag, Code2,
} from "lucide-react";
import type { Analysis } from "@/lib/contracts/types";
import {
  riskBadgeClass, riskColor, cx, copyToClipboard,
  downloadJson, formatAddress, truncateHash,
} from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import { getContractText } from "@/lib/contractTextCache";
import { explorerTxUrl, explorerContractUrl } from "@/lib/constants";
import { GENLAYER_CHAIN } from "@/lib/genlayer/client";
import { useToast } from "@/lib/toast";

type TabKey = "summary" | "obligations" | "risks" | "code" | "metadata";

const TABS: { key: TabKey; label: string; icon: typeof AlignLeft }[] = [
  { key: "summary",     label: "Summary",     icon: AlignLeft   },
  { key: "obligations", label: "Obligations", icon: ListChecks  },
  { key: "risks",       label: "Risks",       icon: AlertTriangle },
  { key: "code",        label: "Contract Code", icon: Code2      },
  { key: "metadata",    label: "Metadata",    icon: Tag         },
];

export function DocumentDetailPanel({
  analysis,
  onClose,
}: {
  analysis: Analysis;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabKey>("summary");

  const txHash = getTxHash(analysis.id);
  const contractText = getContractText(analysis.id);

  const handleCopy = async () => {
    await copyToClipboard(JSON.stringify(analysis, null, 2));
    showToast("Analysis copied to clipboard.", "success");
  };
  const handleDownload = () => {
    downloadJson(`analysis-${analysis.id}.json`, { ...analysis, txHash });
    showToast("Downloaded analysis.json", "success");
  };
  const handleExplorer = () => {
    window.open(txHash ? explorerTxUrl(txHash) : explorerContractUrl(), "_blank", "noreferrer");
  };
  const handleCopyCode = async () => {
    if (!contractText) return;
    await copyToClipboard(contractText);
    showToast("Contract text copied.", "success");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/25 bg-bg-card/80 shadow-glow">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 p-4 sm:p-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-light">
            <FileText className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">{analysis.title}</h3>
              <span className={cx("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", riskBadgeClass[analysis.risk_level])}>
                {analysis.risk_level} Risk
              </span>
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                Completed
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/40">
              #{analysis.id} · {analysis.contract_type} · Analyzed {new Date(analysis.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleCopy}     className={btnCls}><Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copy Analysis</span></button>
          <button onClick={handleDownload} className={btnCls}><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Download JSON</span></button>
          <button onClick={handleExplorer} className={btnCls}><ExternalLink className="h-3.5 w-3.5" /><span className="hidden sm:inline">View on Explorer</span></button>
          <button onClick={onClose} className="ml-1 rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Body: Risk + Summary row ── */}
      <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr] sm:p-5">
        {/* Risk score ring */}
        <div className="flex flex-row items-center gap-5 sm:flex-col sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24">
            <svg width={96} height={96} className="-rotate-90">
              <circle cx={48} cy={48} r={40} stroke="rgba(255,255,255,0.08)" strokeWidth={7} fill="none" />
              <circle
                cx={48} cy={48} r={40}
                stroke={riskColor[analysis.risk_level]}
                strokeWidth={7} fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - analysis.risk_score / 100)}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{analysis.risk_score}</span>
              <span className="text-[10px] text-white/40">/100</span>
            </div>
          </div>
          <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", riskBadgeClass[analysis.risk_level])}>
            {analysis.risk_level} risk
          </span>
        </div>

        {/* Summary preview */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-2">AI Summary</p>
          <p className="text-[13px] leading-relaxed text-white/65 line-clamp-4">{analysis.summary}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <RiskCounter label="High Risks"   count={analysis.risks.filter(r => /high/i.test(r)).length || 0}   color="text-rose-400"   />
            <RiskCounter label="Medium"       count={analysis.risks.filter(r => /medium/i.test(r)).length || 0} color="text-amber-400"  />
            <RiskCounter label="Obligations"  count={analysis.obligations.length}                                color="text-accent-light" />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex overflow-x-auto border-y border-white/5 px-4 scrollbar-thin sm:px-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-medium transition",
              tab === key
                ? "border-b-2 border-accent text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="p-4 sm:p-5">
        {tab === "summary" && (
          <p className="text-[14px] leading-relaxed text-white/65">{analysis.summary}</p>
        )}

        {tab === "obligations" && (
          analysis.obligations.length === 0
            ? <p className="text-sm text-white/40">No specific obligations extracted.</p>
            : <ul className="space-y-2.5">
                {analysis.obligations.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {o}
                  </li>
                ))}
              </ul>
        )}

        {tab === "risks" && (
          analysis.risks.length === 0
            ? <p className="text-sm text-white/40">No specific risks flagged.</p>
            : <ul className="space-y-2.5">
                {analysis.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    {r}
                  </li>
                ))}
              </ul>
        )}

        {tab === "code" && (
          contractText ? (
            <ContractCodeBlock text={contractText} onCopy={handleCopyCode} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-white/35">
              <Code2 className="h-7 w-7" />
              <p className="text-sm">Contract text not available for this analysis.</p>
              <p className="text-xs text-white/25">Only analyses submitted from this browser have their original text cached locally.</p>
            </div>
          )
        )}

        {tab === "metadata" && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <MetaRow label="Analysis ID"    value={`#${analysis.id}`} />
            <MetaRow label="Contract Type"  value={analysis.contract_type} />
            <MetaRow label="Blockchain"     value={GENLAYER_CHAIN.name} />
            <MetaRow label="Status"         value="Completed" valueClass="text-emerald-400" />
            <MetaRow label="Timestamp"      value={new Date(analysis.created_at).toLocaleString()} />
            <MetaRow label="Submitted By"   value={formatAddress(analysis.owner, 8)} mono
              copyValue={analysis.owner} />
            {txHash && (
              <MetaRow label="Transaction Hash" value={truncateHash(txHash, 8)} mono
                copyValue={txHash} className="sm:col-span-2" />
            )}
          </dl>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

const btnCls = "flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5";

function RiskCounter({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cx("text-xl font-bold", color)}>{count}</span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

function ContractCodeBlock({ text, onCopy }: { text: string; onCopy: () => void }) {
  const lines = text.split("\n");
  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#08080f]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs text-white/30">
          <Code2 className="h-3.5 w-3.5 text-accent-light" />
          {lines.length} lines
        </span>
        <button onClick={onCopy} className={btnCls}>
          <Copy className="h-3.5 w-3.5" />
          Copy Code
        </button>
      </div>
      <div className="flex max-h-72 overflow-y-auto font-mono text-[12px] leading-[1.65rem] scrollbar-thin">
        <div className="select-none border-r border-white/5 px-3 py-3 text-right text-accent-light/35">
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <div className="flex-1 overflow-x-auto whitespace-pre px-4 py-3 text-white/75">
          {lines.map((line, i) => <div key={i}>{line || "\u00a0"}</div>)}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono, valueClass, copyValue, className }: {
  label: string; value: string; mono?: boolean; valueClass?: string; copyValue?: string; className?: string;
}) {
  const { showToast } = useToast();
  const doCopy = async () => {
    if (!copyValue) return;
    await copyToClipboard(copyValue);
    showToast(`${label} copied.`, "success");
  };
  return (
    <div className={cx("flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0", className)}>
      <span className="text-white/40">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cx("truncate text-right", mono ? "font-mono text-[11px]" : "text-sm", valueClass || "text-white/80")}>
          {value}
        </span>
        {copyValue && (
          <button onClick={doCopy} className="shrink-0 text-white/30 hover:text-accent-light">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
