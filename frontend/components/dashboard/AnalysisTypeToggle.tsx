"use client";

import { FileCode2, Globe } from "lucide-react";
import { cx } from "@/lib/utils";

export type AnalysisType = "contracts" | "urls";

interface Props {
  value: AnalysisType;
  onChange: (v: AnalysisType) => void;
  className?: string;
}

export function AnalysisTypeToggle({ value, onChange, className }: Props) {
  return (
    <div className={cx("flex items-center rounded-xl border border-white/10 bg-bg-card/60 p-1", className)}>
      <button
        onClick={() => onChange("contracts")}
        className={cx(
          "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition",
          value === "contracts"
            ? "bg-accent-gradient text-white shadow-glow"
            : "text-white/50 hover:text-white"
        )}
      >
        <FileCode2 className="h-3.5 w-3.5" />
        Smart Contracts
      </button>
      <button
        onClick={() => onChange("urls")}
        className={cx(
          "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition",
          value === "urls"
            ? "bg-accent-gradient text-white shadow-glow"
            : "text-white/50 hover:text-white"
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        URLs
      </button>
    </div>
  );
}
