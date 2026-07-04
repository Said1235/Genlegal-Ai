import { FileText, Search, Shield, AlertTriangle, BookOpen, FolderOpen, GitCompare, Bot } from "lucide-react";

const CASES = [
  {
    icon: FileText,
    title: "Intelligent Contract Review",
    description:
      "Get a fast AI-powered evaluation of any contract's content, making it easier to understand key points and identify the most relevant aspects for an efficient review.",
  },
  {
    icon: Search,
    title: "Smart Contract Auditing",
    description:
      "Support your audit process with automated analysis that helps identify potential risks, relevant patterns, and elements that deserve closer attention before deployment.",
  },
  {
    icon: Shield,
    title: "Security Analysis",
    description:
      "Perform an initial evaluation to detect possible vulnerabilities, sensitive permissions, and other factors that could pose risks during contract execution.",
  },
  {
    icon: AlertTriangle,
    title: "Risk Detection",
    description:
      "Automatically identify and classify potential risks present in the contract, allowing you to prioritize elements that require the most attention during your review.",
  },
  {
    icon: BookOpen,
    title: "Contract Summary & Comprehension",
    description:
      "Generate a clear summary and extract relevant information, making it easier to interpret long or complex contracts without reviewing every section from scratch.",
  },
  {
    icon: FolderOpen,
    title: "Analysis Management",
    description:
      "Access previously analyzed contracts at any time, including the original code, AI-generated analysis, risk level, and full history of results.",
  },
  {
    icon: GitCompare,
    title: "Contract Comparison",
    description:
      "Analyze different versions of the same contract to identify relevant changes and evaluate how they affect the analysis result before publication or implementation.",
  },
  {
    icon: Bot,
    title: "Decision-Making Support",
    description:
      "Use AI-generated analyses as a support tool to gain a clearer view of any contract, enabling faster reviews and better-informed decisions.",
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
          GenLegal AI helps developers, legal teams, and organizations analyze contracts faster and more confidently.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
