import { Upload, BrainCircuit, Boxes, FileCheck } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Upload Contract",
    description: "Paste or upload any smart contract source code.",
  },
  {
    icon: BrainCircuit,
    title: "AI Analyzes",
    description: "Our AI reviews the code using advanced models.",
  },
  {
    icon: Boxes,
    title: "Blockchain Verification",
    description: "GenLayer nodes reach consensus on the analysis result.",
  },
  {
    icon: FileCheck,
    title: "Get Results",
    description: "Receive a detailed summary, vulnerabilities, and risk score.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How It Works</h2>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-7 hidden border-t border-dashed border-white/15 lg:block" />
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-card ring-1 ring-accent/30">
                <Icon className="h-6 w-6 text-accent-light" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gradient text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="mt-1.5 max-w-[200px] text-sm leading-relaxed text-white/50">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
