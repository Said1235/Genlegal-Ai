"use client";

/**
 * GenLayer contracts have no way to know their own transaction hash from
 * inside their own execution, so it's never persisted in `Analysis`
 * storage. We remember it locally, in this browser, right after a
 * successful submission - so analyses you just submitted show their real
 * tx hash, while historical ones loaded purely from the chain won't (that's
 * an inherent on-chain limitation, not a bug).
 */
const KEY = "genlegal_tx_hashes";

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function rememberTxHash(analysisId: string, txHash: string): void {
  if (typeof window === "undefined") return;
  const map = readMap();
  map[analysisId] = txHash;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getTxHash(analysisId: string): string | null {
  return readMap()[analysisId] || null;
}
