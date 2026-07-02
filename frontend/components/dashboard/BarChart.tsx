"use client";

export function BarChart({
  data,
  color = "#8b5cf6",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <div className="flex h-40 items-center justify-center text-sm text-white/30">No data yet</div>;
  }

  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-medium text-white/60">{d.value}</span>
          <div className="flex h-32 w-full items-end overflow-hidden rounded-md bg-white/[0.03]">
            <div
              className="w-full rounded-md transition-all"
              style={{
                height: `${Math.max(4, (d.value / max) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="max-w-full truncate text-[11px] text-white/40">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
