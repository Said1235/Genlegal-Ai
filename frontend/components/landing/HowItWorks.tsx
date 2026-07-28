import { ChevronDown } from "lucide-react";

const STEPS = [
  { n: "1", title: "Choose Analysis",             desc: "Select Smart Contract or URL analysis and provide the input." },
  { n: "2", title: "AI Evaluates the Content",    desc: "Our AI models analyze the content using advanced techniques." },
  { n: "3", title: "Validators Reach Consensus",  desc: "GenLayer validators verify results through optimistic democracy." },
  { n: "4", title: "View Verified Results",        desc: "Receive clear results with risk score, insights, and recommendations." },
];

export function HowItWorks() {
  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How GenLegal AI Works</h2>
          <p className="mt-2 text-sm text-white/40">— A simple 4-step process to get trusted results —</p>
        </div>

        {/* Mobile: vertical */}
        <div className="mt-12 flex flex-col items-center gap-0 md:hidden">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
                <span className="text-lg font-extrabold text-white">{step.n}</span>
              </div>
              <div className="mt-3 text-center px-4">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && <ChevronDown className="mt-4 mb-1 h-5 w-5 text-white/20" />}
            </div>
          ))}
        </div>

        {/* Desktop: horizontal */}
        <div className="mt-12 hidden md:grid md:grid-cols-4 md:gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {i < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-7 hidden w-full border-t-2 border-dashed border-white/10 md:block" style={{ left: "50%", right: "-50%" }} />
              )}
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-card border border-white/10 mb-4">
                <span className="text-xl font-extrabold text-accent-light">{step.n}</span>
              </div>
              <p className="text-sm font-semibold mb-1">{step.title}</p>
              <p className="text-xs leading-relaxed text-white/50">{step.desc}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-white/35">
          Every analysis is processed using AI and validated through GenLayer's decentralized consensus, providing transparent and reusable results.
        </p>
      </div>
    </section>
  );
}
