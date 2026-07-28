import { cx } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  colorClass = "text-white",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sublabel?: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-bg-card/60 p-5">
      <div className={cx("mb-3 flex items-center gap-2 text-xs font-medium", colorClass)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {sublabel && <div className={cx("mt-1 text-xs", colorClass)}>{sublabel}</div>}
    </div>
  );
}
