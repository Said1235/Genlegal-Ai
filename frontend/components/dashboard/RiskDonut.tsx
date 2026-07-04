"use client";

import type { AnalyzerStats } from "@/lib/contracts/types";

const COLORS = { high: "#f43f5e", medium: "#f59e0b", low: "#22c55e" };

export function RiskDonut({ stats }: { stats: AnalyzerStats | null }) {
  const total = stats?.total_analyses ?? 0;
  const segments = total
    ? [
        { key: "low", value: stats!.low_risk, color: COLORS.low, label: "Low Risk" },
        { key: "medium", value: stats!.medium_risk, color: COLORS.medium, label: "Medium Risk" },
        { key: "high", value: stats!.high_risk, color: COLORS.high, label: "High Risk" },
      ]
    : [];

  const size = 180;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
          {total === 0 ? null : (
            segments.map((seg) => {
              const fraction = seg.value / total;
              const dash = fraction * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const dashOffset = -acc * circumference;
              acc += fraction;
              if (seg.value === 0) return null;
              return (
                <circle
                  key={seg.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              );
            })
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-[11px] text-white/40">Contracts</span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {[
          { label: "Low Risk", value: stats?.low_risk ?? 0, color: COLORS.low },
          { label: "Medium Risk", value: stats?.medium_risk ?? 0, color: COLORS.medium },
          { label: "High Risk", value: stats?.high_risk ?? 0, color: COLORS.high },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </div>
            <span className="font-medium text-white/85">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
