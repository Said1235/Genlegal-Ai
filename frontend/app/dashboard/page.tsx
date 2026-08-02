"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentAnalyses } from "@/components/dashboard/RecentAnalyses";
import { RiskDonut } from "@/components/dashboard/RiskDonut";
import { ErrorState } from "@/components/dashboard/StateBlocks";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useLanguage } from "@/lib/i18n";
import type { Analysis } from "@/lib/contracts/types";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { stats, analyses, loading, error, refetch, contractConfigured } = useDashboardData();

  const goToDocument = (a: Analysis) => router.push(`/dashboard/documents?id=${a.id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-white/40">{t("dashboard.subtitle")}</p>
        </div>
        <Link
          href="/dashboard/analyze"
          className="flex items-center gap-2 rounded-xl bg-accent-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          {t("dashboard.newAnalysis")}
        </Link>
      </div>

      {!contractConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <ShieldQuestion className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Contract not configured yet</p>
            <p className="mt-0.5 text-amber-200/70">
              Set <code className="rounded bg-bg-hover px-1">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in{" "}
              <code className="rounded bg-bg-hover px-1">.env</code> once{" "}
              <code className="rounded bg-bg-hover px-1">LegalContractAnalyzer</code> is deployed - see
              README.md.
            </p>
          </div>
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="Total Analyses"
              value={stats?.total_analyses ?? 0}
              sublabel={loading ? undefined : "On-chain"}
              colorClass="text-accent-light"
            />
            <StatCard
              icon={ShieldAlert}
              label="High Risk"
              value={stats?.high_risk ?? 0}
              sublabel={pct(stats?.high_risk, stats?.total_analyses)}
              colorClass="text-rose-400"
            />
            <StatCard
              icon={ShieldQuestion}
              label="Medium Risk"
              value={stats?.medium_risk ?? 0}
              sublabel={pct(stats?.medium_risk, stats?.total_analyses)}
              colorClass="text-amber-400"
            />
            <StatCard
              icon={ShieldCheck}
              label="Low Risk"
              value={stats?.low_risk ?? 0}
              sublabel={pct(stats?.low_risk, stats?.total_analyses)}
              colorClass="text-emerald-400"
            />
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px]">
            <RecentAnalyses
              analyses={analyses.slice(0, 5)}
              selectedId={null}
              onSelect={goToDocument}
              loading={loading}
              viewAllHref="/dashboard/history"
            />
            <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
              <h3 className="mb-5 text-[15px] font-semibold">Risk Distribution</h3>
              <RiskDonut stats={stats} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function pct(value?: number, total?: number): string | undefined {
  if (!total) return "0.0%";
  if (value === undefined) return undefined;
  return `${((value / total) * 100).toFixed(1)}%`;
}
