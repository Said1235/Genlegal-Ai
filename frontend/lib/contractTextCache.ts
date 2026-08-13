"use client";

/**
 * The Intelligent Contract stores only the AI analysis result on-chain
 * (summary, obligations, risks, score, level). The original contract text
 * is NOT persisted on-chain - only the submitter's browser gets it.
 * We cache it in localStorage keyed by analysis ID so it's available
 * in Documents/History for analyses submitted from this browser.
 */
const KEY = "genlegal_contract_texts";
const MAX_STORED = 50; // prevent unbounded growth

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function storeContractText(analysisId: string, text: string): void {
  if (typeof window === "undefined") return;
  const map = readMap();
  map[analysisId] = text;
  // Keep only the most recent MAX_STORED entries to avoid filling storage
  const keys = Object.keys(map);
  if (keys.length > MAX_STORED) {
    const oldest = keys[0];
    delete map[oldest];
  }
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getContractText(analysisId: string): string | null {
  return readMap()[analysisId] ?? null;
}
