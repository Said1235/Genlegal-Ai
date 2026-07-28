const CASES = [
  "Smart Contract Auditing",
  "Website Reputation Verification",
  "Security Reviews",
  "Risk Detection",
  "AI Contract Summaries",
  "Phishing Detection",
  "Analysis History",
  "Decision Support",
];

export function UseCasesSection() {
  return (
    <section className="border-t border-white/5 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="mb-8 text-center text-xl font-bold sm:text-2xl">Use Cases</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CASES.map((c) => (
            <div key={c} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-bg-card/60 px-4 py-3.5 text-sm font-medium text-white/70 transition hover:border-accent/30 hover:text-white">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent-light" />{c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
