import { Bot, Layers, LayoutGrid, History } from "lucide-react";

const CARDS = [
  {
    icon: Bot,
    title: "AI-Powered Analysis",
    desc: "Leverages AI to evaluate contracts and websites efficiently, providing actionable insights.",
  },
  {
    icon: Layers,
    title: "GenLayer Consensus",
    desc: "Results are validated through decentralized validator consensus — tamper-proof and verifiable.",
  },
  {
    icon: LayoutGrid,
    title: "Unified Workspace",
    desc: "Analyze smart contracts and website URLs from a single, unified application.",
  },
  {
    icon: History,
    title: "Persistent Analysis History",
    desc: "Review previous analyses, source code, and reputation results whenever needed.",
  },
];

export function WhySection() {
  return (
    <section id="why" className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Why GenLegal AI?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/50">
            One platform. Two AI-powered security tools. Designed for Web3.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-white/8 bg-bg-card/60 p-6 transition hover:border-accent/30 hover:bg-bg-card">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-light transition group-hover:bg-accent-gradient group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
