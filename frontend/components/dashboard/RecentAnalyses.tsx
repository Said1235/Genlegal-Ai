"use client";

import Link from "next/link";
import { FileText, Inbox } from "lucide-react";
import type { Analysis } from "@/lib/contracts/types";
import { riskBadgeClass, timeAgo, cx } from "@/lib/utils";
import { ScoreRing } from "./ScoreRing";

export function RecentAnalyses({
  analyses,
  selectedId,
  onSelect,
  loading,
  viewAllHref,
  emptyMessage = "No analyses yet. Submit a contract to get started.",
  title = "Recent Analyses",
}: {
  analyses: Analysis[];
  selectedId: string | null;
  onSelect: (a: Analysis) => void;
  loading: boolean;
  viewAllHref?: string;
  emptyMessage?: string;
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-medium text-white/40 transition hover:text-accent-light">
            View All
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-white/35">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {analyses.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className={cx(
                "flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition",
                selectedId === a.id ? "bg-accent/10 ring-1 ring-accent/30" : "hover:bg-white/[0.04]"
              )}
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/40">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">{a.title}</p>
                <p className="text-xs text-white/40">Analyzed {timeAgo(a.created_at)}</p>
              </div>
              <span className={cx("hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-block", riskBadgeClass[a.risk_level])}>
                {a.risk_level} Risk
              </span>
              <ScoreRing score={a.risk_score} level={a.risk_level} size={42} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
