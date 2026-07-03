"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, FolderOpen } from "lucide-react";
import { AnalysisDetail } from "@/components/dashboard/AnalysisDetail";
import { EmptyState, ErrorState } from "@/components/dashboard/StateBlocks";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useLanguage } from "@/lib/i18n";
import { riskBadgeClass, timeAgo, truncateHash, cx } from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import { getContractAddress } from "@/lib/genlayer/client";
import type { Analysis } from "@/lib/contracts/types";

export default function DocumentsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("documents.title")}</h1>
        <p className="mt-1 text-sm text-white/40">{t("documents.subtitle")}</p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />}>
        <DocumentsExplorer />
      </Suspense>
    </div>
  );
}

function DocumentsExplorer() {
  const { analyses, loading, error, refetch } = useDashboardData();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("id");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Analysis | null>(null);

  useEffect(() => {
    if (presetId && analyses.length > 0) {
      const match = analyses.find((a) => a.id === presetId);
      if (match) setSelected(match);
    }
  }, [presetId, analyses]);

  const contractAddress = getContractAddress();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return analyses;
    return analyses.filter((a) => {
      const tx = getTxHash(a.id) || "";
      const haystack = [a.id, a.title, a.owner, a.contract_type, tx, contractAddress]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [analyses, query, contractAddress]);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by document name, transaction hash, contract address, or analysis ID..."
          className="w-full rounded-xl border border-white/10 bg-bg-card/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-accent/50"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-bg-card/60">
          <EmptyState
            icon={FolderOpen}
            message={query ? "No documents match your search." : "You don't have any analyses yet."}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const tx = getTxHash(a.id);
            const active = selected?.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={cx(
                  "flex flex-col rounded-2xl border p-4 text-left transition",
                  active ? "border-accent/40 bg-accent/5" : "border-white/8 bg-bg-card/60 hover:border-white/15"
                )}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/40">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-medium text-white/90">{a.title}</span>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-semibold", riskBadgeClass[a.risk_level])}>
                    {a.risk_level} Risk
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Completed
                  </span>
                </div>
                <div className="mt-auto space-y-1 text-[11px] text-white/35">
                  <p>#{a.id} - Analyzed {timeAgo(a.created_at)}</p>
                  <p className="font-mono">{tx ? truncateHash(tx, 6) : "Tx hash unavailable"}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div>
          <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-white/30">Document Details</p>
          <AnalysisDetail analysis={selected} />
        </div>
      )}
    </div>
  );
}
