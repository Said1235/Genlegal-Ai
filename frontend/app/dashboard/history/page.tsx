"use client";

import { useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { AnalysisDetail } from "@/components/dashboard/AnalysisDetail";
import { EmptyState, ErrorState } from "@/components/dashboard/StateBlocks";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useLanguage } from "@/lib/i18n";
import { riskBadgeClass, timeAgo, formatAddress, truncateHash, cx } from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import type { Analysis } from "@/lib/contracts/types";

export default function HistoryPage() {
  const { t } = useLanguage();
  const { analyses, loading, error, refetch } = useDashboardData();
  const [selected, setSelected] = useState<Analysis | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("history.title")}</h1>
        <p className="mt-1 text-sm text-white/40">{t("history.subtitle")}</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-bg-card/60">
          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.03]" />
              ))}
            </div>
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
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className={cx(
                          "cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]",
                          selected?.id === a.id && "bg-accent/5"
                        )}
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-white/50">{timeAgo(a.created_at)}</td>
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-white/60">{formatAddress(a.owner)}</td>
                        <td className="px-5 py-3 font-medium text-white/85">{a.title}</td>
                        <td className="px-5 py-3">
                          <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", riskBadgeClass[a.risk_level])}>
                            {a.risk_level}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            Completed
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-white/40">
                          {tx ? truncateHash(tx, 6) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div>
          <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-white/30">Analysis Details</p>
          <AnalysisDetail analysis={selected} />
        </div>
      )}
    </div>
  );
}
