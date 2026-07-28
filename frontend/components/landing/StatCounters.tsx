export function StatCounters() {
  const STATS = [
    { value: "1,248+", label: "Contracts Analyzed" },
    { value: "3,672+", label: "URLs Verified" },
    { value: "98.7%",  label: "Accurate Results" },
    { value: "4.2s",   label: "Avg. Analysis Time" },
    { value: "100%",   label: "On-Chain Verified" },
    { value: "24/7",   label: "Always Available" },
  ];
  return (
    <section className="border-t border-white/5 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="mb-10 text-center text-xl font-bold tracking-tight sm:text-2xl">
          Trusted by Users. Secured by Blockchain.
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center rounded-2xl border border-white/8 bg-bg-card/60 px-4 py-5 text-center">
              <span className="text-2xl font-extrabold text-accent-light">{value}</span>
              <span className="mt-1 text-xs text-white/45">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
