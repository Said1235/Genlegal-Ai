"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, FolderOpen, Globe } from "lucide-react";
import { DocumentDetailPanel } from "@/components/dashboard/DocumentDetailPanel";
import { EmptyState, ErrorState } from "@/components/dashboard/StateBlocks";
import { AnalysisTypeToggle, type AnalysisType } from "@/components/dashboard/AnalysisTypeToggle";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useUrlHistory } from "@/lib/hooks/useUrlReputationOracle";
import { useLanguage } from "@/lib/i18n";
import { riskBadgeClass, reputationBadgeClass, reputationLabel, type UrlReputation, timeAgo, truncateHash, cx } from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import { getContractAddress } from "@/lib/genlayer/client";
import type { Analysis } from "@/lib/contracts/types";
import type { LocalUrlAnalysis } from "@/lib/contracts/urlTypes";
import Link from "next/link";

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [analysisType, setAnalysisType] = useState<AnalysisType>("contracts");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("documents.title")}</h1>
          <p className="mt-1 text-sm text-white/40">{t("documents.subtitle")}</p>
        </div>
        <AnalysisTypeToggle value={analysisType} onChange={setAnalysisType} />
      </div>
      {analysisType === "contracts" ? (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />}>
          <ContractsExplorer />
        </Suspense>
      ) : (
        <UrlsExplorer />
      )}
    </div>
  );
}

/* ── Smart Contracts ──────────────────────────────────────────────────────── */

function ContractsExplorer() {
  const { analyses, loading, error, refetch } = useDashboardData();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("id");
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Analysis | null>(null);
  const contractAddress = getContractAddress();

  useEffect(() => {
    if (presetId && analyses.length > 0) {
      const match = analyses.find((a) => a.id === presetId);
      if (match) setSelected(match);
    }
  }, [presetId, analyses]);

  const handleSelect = (a: Analysis) => {
    setSelected(a);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return analyses;
    return analyses.filter((a) => {
      const tx = getTxHash(a.id) || "";
      return [a.id, a.title, a.owner, a.contract_type, tx, contractAddress].join(" ").toLowerCase().includes(q);
    });
  }, [analyses, query, contractAddress]);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <SearchBar value={query} onChange={setQuery} placeholder="Search by document name, transaction hash, contract address, or analysis ID..." />
      {selected && <div ref={panelRef} className="animate-fade-in"><DocumentDetailPanel analysis={selected} onClose={() => setSelected(null)} /></div>}
      {loading ? <GridSkeleton /> : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-bg-card/60">
          <EmptyState icon={FolderOpen} message={query ? "No documents match your search." : "No analyses found yet."} />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-white/30">All Documents ({filtered.length})</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => {
              const tx = getTxHash(a.id);
              const active = selected?.id === a.id;
              return (
                <button key={a.id} onClick={() => handleSelect(a)}
                  className={cx("flex flex-col rounded-2xl border p-4 text-left transition hover:shadow-lg",
                    active ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20" : "border-white/8 bg-bg-card/60 hover:border-white/20 hover:bg-bg-card")}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition", active ? "bg-accent-gradient text-white" : "bg-white/[0.04] text-white/40")}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-semibold text-white/90">{a.title}</span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-semibold", riskBadgeClass[a.risk_level])}>{a.risk_level} Risk</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Completed</span>
                  </div>
                  <div className="mt-auto space-y-1 text-[11px] text-white/35">
                    <p>#{a.id} · {timeAgo(a.created_at)}</p>
                    <p className="font-mono truncate">{tx ? truncateHash(tx, 6) : "Tx unavailable"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── URL Analyses ─────────────────────────────────────────────────────────── */

function UrlsExplorer() {
  const { analyses } = useUrlHistory();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LocalUrlAnalysis | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return analyses;
    return analyses.filter((u) => u.url.toLowerCase().includes(q) || u.txHash.toLowerCase().includes(q));
  }, [analyses, query]);

  const handleSelect = (u: LocalUrlAnalysis) => {
    setSelected(u);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className="space-y-5">
      <SearchBar value={query} onChange={setQuery} placeholder="Search by URL or transaction hash..." />

      {selected && (
        <div ref={panelRef} className="animate-fade-in rounded-2xl border border-accent/25 bg-bg-card/80 p-5 shadow-glow">
          <UrlDetailInline entry={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-bg-card/60">
          <EmptyState icon={Globe} message="No URL analyses yet. Analyze a URL to see results here." />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-white/30">URL Analyses ({filtered.length})</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((u) => {
              const rep = u.verdict.risk_level as UrlReputation;
              const active = selected?.id === u.id;
              return (
                <button key={u.id} onClick={() => handleSelect(u)}
                  className={cx("flex flex-col rounded-2xl border p-4 text-left transition",
                    active ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20" : "border-white/8 bg-bg-card/60 hover:border-white/20 hover:bg-bg-card")}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", active ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-white/40")}>
                      <Globe className="h-4 w-4" />
                    </span>
                    <span className="truncate text-xs font-semibold text-white/90">{u.url}</span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-semibold", reputationBadgeClass[rep])}>{reputationLabel[rep]}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Analyzed</span>
                  </div>
                  <div className="mt-auto space-y-1 text-[11px] text-white/35">
                    <p>{timeAgo(u.analyzed_at)}</p>
                    <p className="font-mono">{u.txHash ? truncateHash(u.txHash, 6) : "Tx unavailable"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── URL Inline Detail ────────────────────────────────────────────────────── */

function UrlDetailInline({ entry, onClose }: { entry: LocalUrlAnalysis; onClose: () => void }) {
  const { verdict, url, txHash, analyzed_at } = entry;
  const rep = verdict.risk_level as UrlReputation;
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <p className="break-all text-sm font-semibold text-white">{url}</p>
            <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", reputationBadgeClass[rep])}>{reputationLabel[rep]}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">Analyzed {new Date(analyzed_at).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-lg leading-none">×</button>
      </div>
      <p className="text-sm leading-relaxed text-white/65">{verdict.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-white/40">Score:</span>
        <span className="text-2xl font-bold" style={{ color: verdict.reputation_score > 66 ? "#22c55e" : verdict.reputation_score > 33 ? "#f59e0b" : "#f43f5e" }}>
          {verdict.reputation_score}<span className="text-xs text-white/30">/100</span>
        </span>
        <span className="text-sm text-white/40">Confidence: {Math.round(parseFloat(verdict.confidence) * 100)}%</span>
        {verdict.is_phishing && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">⚠ Phishing</span>}
        {verdict.is_malware && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">⚠ Malware</span>}
        {verdict.is_official && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">✓ Official</span>}
      </div>
      {txHash && <p className="mt-2 font-mono text-[11px] text-white/30">Tx: {txHash}</p>}
    </div>
  );
}

/* ── Shared ───────────────────────────────────────────────────────────────── */

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-bg-card/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />)}
    </div>
  );
}
