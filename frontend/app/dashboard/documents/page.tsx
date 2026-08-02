"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, FolderOpen, Wallet as WalletIcon } from "lucide-react";
import { DocumentDetailPanel } from "@/components/dashboard/DocumentDetailPanel";
import { EmptyState, ErrorState } from "@/components/dashboard/StateBlocks";
import { useMyAnalyses, useContract } from "@/lib/hooks/useLegalContractAnalyzer";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useLanguage } from "@/lib/i18n";
import { riskBadgeClass, timeAgo, truncateHash, formatAddress, cx } from "@/lib/utils";
import { getTxHash } from "@/lib/txCache";
import type { Analysis } from "@/lib/contracts/types";

// A full, valid wallet address - not a partial prefix, since get_my_analyses()
// on-chain constructs Address(owner_address) and rejects anything shorter.
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export default function DocumentsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("documents.title")}</h1>
        <p className="mt-1 text-sm text-white/40">{t("documents.subtitle")}</p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />}>
        <DocumentsExplorer />
      </Suspense>
    </div>
  );
}

function DocumentsExplorer() {
  const { address, isConnected } = useWallet();
  const contract = useContract();
  const { analyses: myAnalyses, loading: myLoading, error: myError, refetch: refetchMine } = useMyAnalyses(address);

  const searchParams = useSearchParams();
  const presetId = searchParams.get("id");
  const panelRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Analysis | null>(null);

  // Whole-network list — only fetched lazily, the first time someone types a
  // non-address search. Cached afterwards so further keystrokes just filter
  // in memory instead of re-querying the chain.
  const [networkAll, setNetworkAll] = useState<Analysis[] | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Results for a specific wallet address pasted into the search box.
  const [addressResults, setAddressResults] = useState<Analysis[] | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const isAddressQuery = ADDRESS_RE.test(trimmedQuery);
  const mode: "mine" | "address" | "text" = !trimmedQuery ? "mine" : isAddressQuery ? "address" : "text";

  // Address search - runs whenever the box holds a complete, valid address.
  useEffect(() => {
    if (!isAddressQuery || !contract) return;
    let cancelled = false;
    setAddressLoading(true);
    setAddressError(null);
    contract
      .getMyAnalyses(trimmedQuery)
      .then((res) => { if (!cancelled) setAddressResults(res.slice().reverse()); })
      .catch((err: any) => { if (!cancelled) setAddressError(err?.message || "Failed to look up that address."); })
      .finally(() => { if (!cancelled) setAddressLoading(false); });
    return () => { cancelled = true; };
  }, [isAddressQuery, trimmedQuery, contract]);

  // Text search - fetch the full network list once (lazily), then filter
  // client-side on every keystroke without re-hitting the chain.
  useEffect(() => {
    if (mode !== "text" || networkAll !== null || !contract) return;
    let cancelled = false;
    setNetworkLoading(true);
    setNetworkError(null);
    contract
      .getAllAnalyses()
      .then((res) => { if (!cancelled) setNetworkAll(res.slice().reverse()); })
      .catch((err: any) => { if (!cancelled) setNetworkError(err?.message || "Failed to search the network."); })
      .finally(() => { if (!cancelled) setNetworkLoading(false); });
    return () => { cancelled = true; };
  }, [mode, networkAll, contract]);

  // Preset from URL param (e.g. coming from Dashboard) - look across whatever
  // pools we currently have loaded.
  useEffect(() => {
    if (!presetId) return;
    for (const pool of [myAnalyses, networkAll || [], addressResults || []]) {
      const match = pool.find((a) => a.id === presetId);
      if (match) { setSelected(match); return; }
    }
  }, [presetId, myAnalyses, networkAll, addressResults]);

  const handleSelect = (a: Analysis) => {
    setSelected(a);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const results = useMemo<Analysis[]>(() => {
    if (mode === "mine") return myAnalyses;
    if (mode === "address") return addressResults || [];
    const q = trimmedQuery.toLowerCase();
    return (networkAll || []).filter((a) => {
      const tx = getTxHash(a.id) || "";
      return [a.id, a.title, a.owner, a.contract_type, tx].join(" ").toLowerCase().includes(q);
    });
  }, [mode, myAnalyses, addressResults, networkAll, trimmedQuery]);

  const loading =
    mode === "mine" ? myLoading : mode === "address" ? addressLoading : networkLoading;
  const loadError =
    mode === "mine" ? myError : mode === "address" ? addressError : networkError;
  const onRetry =
    mode === "mine"
      ? refetchMine
      : mode === "address"
      ? () => { setAddressResults(null); setAddressError(null); /* effect re-runs on next render */ }
      : () => { setNetworkAll(null); setNetworkError(null); };

  // Not connected and not actively searching someone else's address/network -
  // there is nothing meaningful to show yet.
  if (!isConnected && mode === "mine") {
    return (
      <div className="space-y-5">
        <SearchBar query={query} setQuery={setQuery} />
        <div className="rounded-2xl border border-white/8 bg-bg-card/60">
          <EmptyState
            icon={WalletIcon}
            message="Connect your wallet to see the contracts you've analyzed - or search above by wallet address or title to browse the network."
          />
        </div>
      </div>
    );
  }

  if (loadError) return <ErrorState message={loadError} onRetry={onRetry} />;

  const heading =
    mode === "mine"
      ? "Your Documents"
      : mode === "address"
      ? `Documents by ${formatAddress(trimmedQuery)}`
      : "Network Results";

  return (
    <div className="space-y-5">
      <SearchBar query={query} setQuery={setQuery} />

      {/* Detail panel — appears ABOVE the grid when a document is selected */}
      {selected && (
        <div ref={panelRef} className="animate-fade-in">
          <DocumentDetailPanel
            analysis={selected}
            onClose={() => setSelected(null)}
          />
        </div>
      )}

      {/* Grid of contracts */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-bg-card/60">
          <EmptyState
            icon={FolderOpen}
            message={
              mode === "mine"
                ? "You haven't analyzed any contracts yet."
                : mode === "address"
                ? "That wallet hasn't submitted any analyses."
                : "No documents match your search."
            }
          />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-white/30">
            {heading} ({results.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((a) => {
              const tx = getTxHash(a.id);
              const active = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => handleSelect(a)}
                  className={cx(
                    "flex flex-col rounded-2xl border p-4 text-left transition hover:shadow-lg",
                    active
                      ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20"
                      : "border-white/8 bg-bg-card/60 hover:border-white/20 hover:bg-bg-card"
                  )}
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className={cx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
                      active ? "bg-accent-gradient text-white" : "bg-white/[0.04] text-white/40"
                    )}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-semibold text-white/90">{a.title}</span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-semibold", riskBadgeClass[a.risk_level])}>
                      {a.risk_level} Risk
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Completed
                    </span>
                  </div>
                  <div className="mt-auto space-y-1 text-[11px] text-white/35">
                    <p>#{a.id} · {timeAgo(a.created_at)}</p>
                    <p className="font-mono truncate">{tx ? truncateHash(tx, 6) : "Tx unavailable"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SearchBar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your documents, or paste a wallet address (0x...) to browse the network..."
        className="w-full rounded-xl border border-white/10 bg-bg-card/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none"
      />
    </div>
  );
}
