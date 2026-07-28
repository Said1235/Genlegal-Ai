"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles, Globe } from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentAnalyses } from "@/components/dashboard/RecentAnalyses";
import { RiskDonut } from "@/components/dashboard/RiskDonut";
import { ErrorState } from "@/components/dashboard/StateBlocks";
import { AnalysisTypeToggle, type AnalysisType } from "@/components/dashboard/AnalysisTypeToggle";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useUrlHistory } from "@/lib/hooks/useUrlReputationOracle";
import { useLanguage } from "@/lib/i18n";
import { reputationBadgeClass, reputationLabel, cx, timeAgo } from "@/lib/utils";
import type { Analysis } from "@/lib/contracts/types";
import type { LocalUrlAnalysis } from "@/lib/contracts/urlTypes";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [analysisType, setAnalysisType] = useState<AnalysisType>("contracts");
  const { stats, analyses, loading, error, refetch, contractConfigured } = useDashboardData();
  const { analyses: urlAnalyses, refresh: refreshUrls } = useUrlHistory();

  const goToDocument = (a: Analysis) => router.push(`/dashboard/documents?id=${a.id}`);

  /* ── URL stats (from local cache) ── */
  const urlStats = {
    total: urlAnalyses.length,
    safe: urlAnalyses.filter((u) => u.verdict.risk_level === "safe").length,
    suspicious: urlAnalyses.filter((u) => u.verdict.risk_level === "suspicious").length,
    malicious: urlAnalyses.filter((u) => u.verdict.risk_level === "malicious").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-white/40">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AnalysisTypeToggle value={analysisType} onChange={setAnalysisType} />
          <Link
            href={analysisType === "urls" ? "/dashboard/analyze/url" : "/dashboard/analyze"}
            className="flex items-center gap-2 rounded-xl bg-accent-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            {analysisType === "urls" ? "Analyze URL" : t("dashboard.newAnalysis")}
          </Link>
        </div>
      </div>

      {error && analysisType === "contracts" && <ErrorState message={error} onRetry={refetch} />}

      {/* ── CONTRACTS view ── */}
      {analysisType === "contracts" && !error && (
        <>
          <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatCard icon={BarChart3} label="Total Analyses" value={stats?.total_analyses ?? 0} sublabel={loading ? undefined : "On-chain"} colorClass="text-accent-light" />
            <StatCard icon={ShieldAlert} label="High Risk" value={stats?.high_risk ?? 0} sublabel={pct(stats?.high_risk, stats?.total_analyses)} colorClass="text-rose-400" />
            <StatCard icon={ShieldQuestion} label="Medium Risk" value={stats?.medium_risk ?? 0} sublabel={pct(stats?.medium_risk, stats?.total_analyses)} colorClass="text-amber-400" />
            <StatCard icon={ShieldCheck} label="Low Risk" value={stats?.low_risk ?? 0} sublabel={pct(stats?.low_risk, stats?.total_analyses)} colorClass="text-emerald-400" />
          </div>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px]">
            <RecentAnalyses analyses={analyses.slice(0, 5)} selectedId={null} onSelect={goToDocument} loading={loading} viewAllHref="/dashboard/history" />
            <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
              <h3 className="mb-5 text-[15px] font-semibold">Risk Distribution</h3>
              <RiskDonut stats={stats} />
            </div>
          </div>
        </>
      )}

      {/* ── URLs view ── */}
      {analysisType === "urls" && (
        <>
          <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatCard icon={Globe} label="URLs Analyzed" value={urlStats.total} sublabel="In this browser" colorClass="text-cyan-400" />
            <StatCard icon={ShieldCheck} label="Safe" value={urlStats.safe} sublabel={pct(urlStats.safe, urlStats.total)} colorClass="text-emerald-400" />
            <StatCard icon={ShieldQuestion} label="Suspicious" value={urlStats.suspicious} sublabel={pct(urlStats.suspicious, urlStats.total)} colorClass="text-amber-400" />
            <StatCard icon={ShieldAlert} label="Malicious" value={urlStats.malicious} sublabel={pct(urlStats.malicious, urlStats.total)} colorClass="text-rose-400" />
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">Recent URL Analyses</h3>
              <Link href="/dashboard/history" className="text-xs font-medium text-white/40 transition hover:text-accent-light">View All</Link>
            </div>
            {urlAnalyses.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-white/35">
                <Globe className="h-7 w-7" />
                <p className="text-sm">No URL analyses yet. <Link href="/dashboard/analyze/url" className="text-accent-light hover:underline">Analyze a URL →</Link></p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {urlAnalyses.slice(0, 5).map((u) => {
                  const rep = u.verdict.risk_level as keyof typeof reputationBadgeClass;
                  return (
                    <div key={u.id} className="flex items-center gap-4 rounded-xl px-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40">
                        <Globe className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/90">{u.url}</p>
                        <p className="text-xs text-white/40">Analyzed {timeAgo(u.analyzed_at)}</p>
                      </div>
                      <span className={cx("hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-block", reputationBadgeClass[rep])}>
                        {reputationLabel[rep]}
                      </span>
                      <span className="text-lg font-bold" style={{ color: u.verdict.reputation_score > 66 ? "#22c55e" : u.verdict.reputation_score > 33 ? "#f59e0b" : "#f43f5e" }}>
                        {u.verdict.reputation_score}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function pct(v?: number, t?: number): string {
  if (!t) return "0.0%";
  if (v === undefined) return "";
  return `${((v / t) * 100).toFixed(1)}%`;
}
