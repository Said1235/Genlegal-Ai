import { FileText, ShieldCheck, Zap, ShieldAlert, Hash, FileBarChart2, BookOpen, Bot, Lock } from "lucide-react";

const ITEMS = [
  { icon: FileText,      label: "AI Contract Analysis",    sub: "Smart review in seconds" },
  { icon: ShieldAlert,   label: "Vulnerability Detection", sub: "Reentrancy, access control & more" },
  { icon: Zap,           label: "Code Summarization",      sub: "Plain-English breakdown" },
  { icon: ShieldCheck,   label: "Blockchain Verified",     sub: "Results secured on-chain" },
  { icon: FileBarChart2, label: "AI Risk Scoring",         sub: "Clear score & insights" },
  { icon: Lock,          label: "Secure & Private",        sub: "Your code stays protected" },
  { icon: Hash,          label: "Metadata Inspection",     sub: "Full analysis traceability" },
  { icon: BookOpen,      label: "Security Report Export",  sub: "Downloadable JSON reports" },
  { icon: Bot,           label: "Pre-Audit Triage",        sub: "Automated first-pass review" },
];

// Tripled so the loop looks seamless at any viewport width
const TRACK = [...ITEMS, ...ITEMS, ...ITEMS];

export function FeatureTicker() {
  return (
    <div
      className="relative overflow-hidden border-y border-white/5 bg-bg-panel/50 py-5"
      aria-hidden="true"
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-panel/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-panel/80 to-transparent" />

      <div
        className="flex w-max animate-[ticker_42s_linear_infinite] hover:[animation-play-state:paused]"
      >
        {TRACK.map(({ icon: Icon, label, sub }, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 border-r border-white/5 px-8"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-light">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="whitespace-nowrap text-[13px] font-semibold text-white/85">{label}</p>
              <p className="whitespace-nowrap text-[11px] text-white/40">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
