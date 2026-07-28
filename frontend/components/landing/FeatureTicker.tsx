const ITEMS = [
  { title: "AI Validators",        sub: "Decentralized network"         },
  { title: "On-Chain Results",     sub: "Tamper-proof & verifiable"     },
  { title: "Optimistic Democracy", sub: "Consensus by equivalence"      },
  { title: "Built for Web3",       sub: "Secure, transparent, open"     },
  { title: "AI Validators",        sub: "Decentralized network"         },
  { title: "On-Chain Results",     sub: "Tamper-proof & verifiable"     },
  { title: "Optimistic Democracy", sub: "Consensus by equivalence"      },
  { title: "Built for Web3",       sub: "Secure, transparent, open"     },
  { title: "AI Validators",        sub: "Decentralized network"         },
  { title: "On-Chain Results",     sub: "Tamper-proof & verifiable"     },
  { title: "Optimistic Democracy", sub: "Consensus by equivalence"      },
  { title: "Built for Web3",       sub: "Secure, transparent, open"     },
];

export function FeatureTicker() {
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-bg-panel/40 py-5" aria-hidden="true">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-panel/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-panel/80 to-transparent" />
      <div className="flex w-max animate-[ticker_32s_linear_infinite] hover:[animation-play-state:paused]">
        {ITEMS.map(({ title, sub }, i) => (
          <div key={i} className="flex shrink-0 items-center gap-6 border-r border-white/5 px-10">
            <div>
              <p className="whitespace-nowrap text-sm font-semibold text-white/85">{title}</p>
              <p className="whitespace-nowrap text-xs text-white/40">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
