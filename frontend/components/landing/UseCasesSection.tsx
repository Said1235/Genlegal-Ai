import { Code2, ShieldAlert, BookOpen, FolderOpen, GitCompare, Bot } from "lucide-react";

const CASES = [
  {
    icon: Code2,
    title: "Code Review",
    description:
      "A fast AI first-pass over your smart contract's source, surfacing what it does and where to look closer.",
  },
  {
    icon: ShieldAlert,
    title: "Vulnerability Detection",
    description:
      "Flags common issues - reentrancy, unchecked calls, access-control gaps, overflow - and scores them 0-100.",
  },
  {
    icon: BookOpen,
    title: "Plain-English Summaries",
    description:
      "Turns dense contract code into a short summary anyone on the team can read, not just the author.",
  },
  {
    icon: FolderOpen,
    title: "Analysis History",
    description:
      "Every past review - source, AI summary, risk level - stays searchable and available on-chain.",
  },
  {
    icon: GitCompare,
    title: "Compare Versions",
    description:
      "Re-analyze an updated draft and see how the risk profile changed before you deploy.",
  },
  {
    icon: Bot,
    title: "Pre-Audit Triage",
    description:
      "Use the AI-generated risk score and findings as a first pass before a professional security audit.",
  },
];

export function UseCasesSection() {
  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          — <span className="text-gradient">Use Cases</span> —
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/50">
          GenLegal AI helps developers get a fast first read on a smart contract's security.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/8 bg-bg-card/60 p-6 transition hover:border-accent/30 hover:bg-bg-card"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-light transition group-hover:bg-accent-gradient group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold leading-snug">{title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
