"use client";

import { useMemo } from "react";
import { BarChart3, ShieldAlert, ShieldCheck, ShieldQuestion, CalendarDays } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RiskDonut } from "@/components/dashboard/RiskDonut";
import { BarChart } from "@/components/dashboard/BarChart";
import { ErrorState } from "@/components/dashboard/StateBlocks";
import { useDashboardData } from "@/lib/hooks/useLegalContractAnalyzer";
import { useLanguage } from "@/lib/i18n";
import { formatAddress, isToday } from "@/lib/utils";

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const { stats, analyses, loading, error, refetch } = useDashboardData();

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of analyses) counts.set(a.contract_type, (counts.get(a.contract_type) || 0) + 1);
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [analyses]);

  const byDay = useMemo(() => {
    const days: { label: string; value: number; key: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: d.toLocaleDateString(undefined, { weekday: "short" }), value: 0 });
    }
    for (const a of analyses) {
      const key = a.created_at.slice(0, 10);
      const day = days.find((d) => d.key === key);
      if (day) day.value++;
    }
    return days;
  }, [analyses]);

  const byWallet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of analyses) counts.set(a.owner, (counts.get(a.owner) || 0) + 1);
    return Array.from(counts.entries())
      .map(([owner, value]) => ({ label: formatAddress(owner), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [analyses]);

  const today = useMemo(() => analyses.filter((a) => isToday(a.created_at)).length, [analyses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("analytics.title")}</h1>
        <p className="mt-1 text-sm text-white/40">{t("analytics.subtitle")}</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={BarChart3} label="Total Analyses" value={stats?.total_analyses ?? 0} colorClass="text-accent-light" />
            <StatCard icon={ShieldAlert} label="High Risk" value={stats?.high_risk ?? 0} colorClass="text-rose-400" />
            <StatCard icon={ShieldQuestion} label="Medium Risk" value={stats?.medium_risk ?? 0} colorClass="text-amber-400" />
            <StatCard icon={ShieldCheck} label="Low Risk" value={stats?.low_risk ?? 0} colorClass="text-emerald-400" />
            <StatCard icon={CalendarDays} label="Analyses Today" value={today} colorClass="text-white" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
              <h3 className="mb-5 text-[15px] font-semibold">Risk Distribution</h3>
              {loading ? <div className="h-44 animate-pulse rounded-xl bg-white/[0.03]" /> : <RiskDonut stats={stats} />}
            </div>
            <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
              <h3 className="mb-5 text-[15px] font-semibold">Analyses - Last 7 Days</h3>
              {loading ? <div className="h-44 animate-pulse rounded-xl bg-white/[0.03]" /> : <BarChart data={byDay} color="#8b5cf6" />}
            </div>
            <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
              <h3 className="mb-5 text-[15px] font-semibold">Top Contract Types</h3>
              {loading ? <div className="h-44 animate-pulse rounded-xl bg-white/[0.03]" /> : <BarChart data={byType} color="#a78bfa" />}
            </div>
            <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
              <h3 className="mb-5 text-[15px] font-semibold">Wallet Activity</h3>
              {loading ? <div className="h-44 animate-pulse rounded-xl bg-white/[0.03]" /> : <BarChart data={byWallet} color="#22c55e" />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
