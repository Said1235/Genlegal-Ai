"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, FolderOpen } from "lucide-react";
import { DocumentDetailPanel } from "@/components/dashboard/DocumentDetailPanel";
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
    <div className="space-y-5">
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
  const panelRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Analysis | null>(null);

  // Preset from URL param (e.g. coming from Dashboard)
  useEffect(() => {
    if (presetId && analyses.length > 0) {
      const match = analyses.find((a) => a.id === presetId);
      if (match) setSelected(match);
    }
  }, [presetId, analyses]);

  // Scroll to top of panel when a document is selected
  const handleSelect = (a: Analysis) => {
    setSelected(a);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const contractAddress = getContractAddress();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return analyses;
    return analyses.filter((a) => {
      const tx = getTxHash(a.id) || "";
      return [a.id, a.title, a.owner, a.contract_type, tx, contractAddress]
        .join(" ").toLowerCase().includes(q);
    });
  }, [analyses, query, contractAddress]);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      {/* Search bar — always visible */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by document name, transaction hash, contract address, or analysis ID..."
          className="w-full rounded-xl border border-white/10 bg-bg-card/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none"
        />
      </div>

      {/* Detail panel — appears ABOVE the grid when a document is selected */}
      {selected && (
        <div ref={panelRef} className="animate-fade-in">
          <DocumentDetailPanel
            analysis={selected}
            onClose={() => setSelected(null)}
          />
        </div>
      )}

      {/* Grid of contracts */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-bg-card/60">
          <EmptyState icon={FolderOpen} message={query ? "No documents match your search." : "No analyses found yet."} />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-white/30">
            All Documents ({filtered.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => {
              const tx = getTxHash(a.id);
              const active = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => handleSelect(a)}
                  className={cx(
                    "flex flex-col rounded-2xl border p-4 text-left transition hover:shadow-lg",
                    active
                      ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20"
                      : "border-white/8 bg-bg-card/60 hover:border-white/20 hover:bg-bg-card"
                  )}
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className={cx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
                      active ? "bg-accent-gradient text-white" : "bg-white/[0.04] text-white/40"
                    )}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-semibold text-white/90">{a.title}</span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-semibold", riskBadgeClass[a.risk_level])}>
                      {a.risk_level} Risk
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Completed
                    </span>
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
