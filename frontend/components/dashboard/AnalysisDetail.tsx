"use client";

import { useState } from "react";
import {
  FileText,
  AlignLeft,
  ListChecks,
  AlertTriangle,
  ScrollText,
  Tag,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
} from "lucide-react";
import type { Analysis } from "@/lib/contracts/types";
import { riskBadgeClass, riskColor, cx, copyToClipboard, downloadJson, truncateHash, formatAddress } from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import { GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { GENLAYER_EXPLORER_URL } from "@/lib/constants";
import { useToast } from "@/lib/toast";

const TABS = [
  { key: "summary", label: "Summary", icon: AlignLeft },
  { key: "obligations", label: "Obligations", icon: ListChecks },
  { key: "risks", label: "Risks", icon: AlertTriangle },
  { key: "full", label: "Full Analysis", icon: ScrollText },
  { key: "metadata", label: "Metadata", icon: Tag },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AnalysisDetail({ analysis }: { analysis: Analysis | null }) {
  const [tab, setTab] = useState<TabKey>("summary");
  const { showToast } = useToast();

  if (!analysis) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-bg-card/60 p-10 text-center text-white/35">
        <FileText className="mb-3 h-8 w-8" />
        <p className="text-sm">Select an analysis from the list above to see the full breakdown.</p>
      </div>
    );
  }

  const txHash = getTxHash(analysis.id);
  const explorerBase = GENLAYER_NETWORK.blockExplorerUrls[0];

  const handleOpenExplorer = async () => {
    if (txHash) {
      await copyToClipboard(txHash);
      showToast("Transaction hash copied — paste it in the GenLayer explorer to search.", "info");
    }
    window.open(GENLAYER_EXPLORER_URL, "_blank", "noreferrer");
  };

  const handleCopy = async () => {
    await copyToClipboard(JSON.stringify(analysis, null, 2));
    showToast("Analysis copied to clipboard.", "success");
  };
  const handleDownload = () => {
    downloadJson(`analysis-${analysis.id}.json`, analysis);
    showToast("Downloaded analysis.json", "success");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-bg-card/60">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient">
            <FileText className="h-4.5 w-4.5 text-white" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{analysis.title}</h3>
              <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", riskBadgeClass[analysis.risk_level])}>
                {analysis.risk_level} Risk
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/40">
              {analysis.contract_type} - Analyzed on {new Date(analysis.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5"
          >
            <Copy className="h-3 w-3" />
            Copy Analysis
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5"
          >
            <Download className="h-3 w-3" />
            Download JSON
          </button>
          {txHash ? (
            <button
              onClick={handleOpenExplorer}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/5"
            >
              View on Explorer
              <ExternalLink className="h-3 w-3" />
            </button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-white/5 px-3 py-1.5 text-xs font-medium text-white/25">
              View on Explorer
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-5 pt-3 scrollbar-thin">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition",
              tab === key ? "border-b-2 border-accent text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_220px]">
        <div>
          {tab === "summary" && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white/80">AI Summary</h4>
              <p className="text-[14px] leading-relaxed text-white/60">{analysis.summary}</p>
            </div>
          )}

          {tab === "obligations" && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white/80">Obligations</h4>
              {analysis.obligations.length === 0 ? (
                <p className="text-sm text-white/40">No specific obligations were extracted.</p>
              ) : (
                <ul className="space-y-2.5">
                  {analysis.obligations.map((o, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "risks" && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white/80">Risks Identified</h4>
              {analysis.risks.length === 0 ? (
                <p className="text-sm text-white/40">No specific risks were flagged.</p>
              ) : (
                <ul className="space-y-2.5">
                  {analysis.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "full" && (
            <div className="space-y-5">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-white/80">AI Summary</h4>
                <p className="text-[14px] leading-relaxed text-white/60">{analysis.summary}</p>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-white/80">Obligations</h4>
                <ul className="space-y-2">
                  {analysis.obligations.map((o, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-white/80">Risks Identified</h4>
                <ul className="space-y-2">
                  {analysis.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "metadata" && (
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/40">Analysis ID</dt>
                <dd className="mt-0.5 font-mono text-white/80">#{analysis.id}</dd>
              </div>
              <div>
                <dt className="text-white/40">Contract Type</dt>
                <dd className="mt-0.5 text-white/80">{analysis.contract_type}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="mb-1 text-white/40">Submitted By</dt>
                <dd className="flex items-center gap-2">
                  <span className="truncate font-mono text-[12px] text-white/80">
                    {formatAddress(analysis.owner, 8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(analysis.owner).then(() => {})}
                    title={analysis.owner}
                    className="shrink-0 text-white/30 hover:text-accent-light"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Timestamp</dt>
                <dd className="mt-0.5 text-[12px] text-white/80">{new Date(analysis.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-white/40">Transaction Hash</dt>
                <dd className="mt-0.5 font-mono text-[12px] text-white/80">
                  {txHash ? truncateHash(txHash, 8) : <span className="text-white/30">Not available</span>}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="flex flex-col items-center justify-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <span className="text-xs font-medium text-white/40">Risk Score</span>
          <div className="relative my-1 flex h-24 w-24 items-center justify-center">
            <svg width={96} height={96} className="-rotate-90">
              <circle cx={48} cy={48} r={42} stroke="rgba(255,255,255,0.08)" strokeWidth={7} fill="none" />
              <circle
                cx={48}
                cy={48}
                r={42}
                stroke={riskColor[analysis.risk_level]}
                strokeWidth={7}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - analysis.risk_score / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{analysis.risk_score}</span>
              <span className="text-[10px] text-white/40">/100</span>
            </div>
          </div>
          <span className={cx("rounded-full px-3 py-1 text-[11px] font-semibold", riskBadgeClass[analysis.risk_level])}>
            {analysis.risk_level} risk
          </span>
        </div>
      </div>
    </div>
  );
}
