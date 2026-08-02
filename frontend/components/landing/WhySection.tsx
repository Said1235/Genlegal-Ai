import { Zap, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Get a comprehensive summary of any smart contract in seconds.",
  },
  {
    icon: ShieldAlert,
    title: "Flag Vulnerabilities",
    description: "Surface common security issues like reentrancy and access-control gaps.",
  },
  {
    icon: AlertTriangle,
    title: "Score the Risk",
    description: "Get a 0-100 risk score based on the concrete issues found in the code.",
  },
  {
    icon: ShieldCheck,
    title: "Blockchain Verified",
    description: "Results are verified on-chain using GenLayer consensus.",
  },
];

export function WhySection() {
  return (
    <section id="why" className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Why GenLegal AI?</h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/8 bg-bg-card/60 p-6 transition hover:border-accent/30 hover:bg-bg-card"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-light transition group-hover:bg-accent-gradient group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
