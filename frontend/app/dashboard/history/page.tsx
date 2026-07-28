"use client";

import { useRef, useState } from "react";
import { History as HistoryIcon, Globe } from "lucide-react";
import { DocumentDetailPanel } from "@/components/dashboard/DocumentDetailPanel";
import { EmptyState, ErrorState } from "@/components/dashboard/StateBlocks";
import { AnalysisTypeToggle, type AnalysisType } from "@/components/dashboard/AnalysisTypeToggle";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useUrlHistory } from "@/lib/hooks/useUrlReputationOracle";
import { useLanguage } from "@/lib/i18n";
import { riskBadgeClass, reputationBadgeClass, reputationLabel, type UrlReputation, timeAgo, formatAddress, truncateHash, cx } from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import type { Analysis } from "@/lib/contracts/types";
import type { LocalUrlAnalysis } from "@/lib/contracts/urlTypes";

export default function HistoryPage() {
  const { t } = useLanguage();
  const [analysisType, setAnalysisType] = useState<AnalysisType>("contracts");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("history.title")}</h1>
          <p className="mt-1 text-sm text-white/40">{t("history.subtitle")}</p>
        </div>
        <AnalysisTypeToggle value={analysisType} onChange={setAnalysisType} />
      </div>

      {analysisType === "contracts" ? <ContractHistory /> : <UrlHistory />}
    </div>
  );
}

/* ── Smart Contracts history ─────────────────────────────────────────────── */

function ContractHistory() {
  const { analyses, loading, error, refetch } = useDashboardData();
  const [selected, setSelected] = useState<Analysis | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSelect = (a: Analysis) => {
    const already = selected?.id === a.id;
    setSelected(already ? null : a);
    if (!already) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      {selected && (
        <div ref={panelRef} className="animate-fade-in">
          <DocumentDetailPanel analysis={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-bg-card/60">
        {loading ? (
          <div className="space-y-2 p-4">{[0,1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.03]" />)}</div>
        ) : analyses.length === 0 ? (
          <EmptyState icon={HistoryIcon} message="No analyses found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Wallet</th>
                  <th className="px-5 py-3 font-medium">Contract</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => {
                  const tx = getTxHash(a.id);
                  return (
                    <tr key={a.id} onClick={() => handleSelect(a)}
                      className={cx("cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]", selected?.id === a.id && "bg-accent/5")}>
                      <td className="whitespace-nowrap px-5 py-3 text-white/50">{timeAgo(a.created_at)}</td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-white/60">{formatAddress(a.owner)}</td>
                      <td className="px-5 py-3 font-medium text-white/85">{a.title}</td>
                      <td className="px-5 py-3">
                        <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", riskBadgeClass[a.risk_level])}>{a.risk_level}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">Completed</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-white/40">{tx ? truncateHash(tx, 6) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ── URL history ─────────────────────────────────────────────────────────── */

function UrlHistory() {
  const { analyses } = useUrlHistory();
  const [selected, setSelected] = useState<LocalUrlAnalysis | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSelect = (u: LocalUrlAnalysis) => {
    const already = selected?.id === u.id;
    setSelected(already ? null : u);
    if (!already) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <>
      {selected && (
        <div ref={panelRef} className="animate-fade-in rounded-2xl border border-accent/25 bg-bg-card/80 p-5 shadow-glow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-cyan-400" />
                <p className="break-all text-sm font-semibold">{selected.url}</p>
                <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", reputationBadgeClass[selected.verdict.risk_level as UrlReputation])}>
                  {reputationLabel[selected.verdict.risk_level as UrlReputation]}
                </span>
              </div>
              <p className="text-xs text-white/40">Analyzed {new Date(selected.analyzed_at).toLocaleString()}</p>
              <p className="mt-2 text-sm text-white/65">{selected.verdict.summary}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-white/50">Score: <strong className="text-white">{selected.verdict.reputation_score}/100</strong></span>
                <span className="text-sm text-white/50">Confidence: <strong className="text-white">{Math.round(parseFloat(selected.verdict.confidence)*100)}%</strong></span>
              </div>
              {selected.txHash && <p className="mt-1 font-mono text-[11px] text-white/30">Tx: {selected.txHash}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-lg leading-none shrink-0">×</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-bg-card/60">
        {analyses.length === 0 ? (
          <EmptyState icon={Globe} message="No URL analyses found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">URL</th>
                  <th className="px-5 py-3 font-medium">Reputation</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((u) => {
                  const rep = u.verdict.risk_level as UrlReputation;
                  return (
                    <tr key={u.id} onClick={() => handleSelect(u)}
                      className={cx("cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]", selected?.id === u.id && "bg-accent/5")}>
                      <td className="whitespace-nowrap px-5 py-3 text-white/50">{timeAgo(u.analyzed_at)}</td>
                      <td className="max-w-[200px] truncate px-5 py-3 font-medium text-white/85">{u.url}</td>
                      <td className="px-5 py-3">
                        <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", reputationBadgeClass[rep])}>{reputationLabel[rep]}</span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-white/80">{u.verdict.reputation_score}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">Analyzed</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-white/40">
                        {u.txHash ? truncateHash(u.txHash, 6) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
