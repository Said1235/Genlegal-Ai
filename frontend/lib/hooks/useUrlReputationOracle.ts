"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import UrlReputationOracle from "../contracts/UrlReputationOracle";
import { URL_ORACLE_ADDRESS } from "../constants";
import { useWallet } from "../genlayer/WalletProvider";
import { storeUrlAnalysis, getAllUrlAnalyses } from "../urlHistoryCache";
import type { LocalUrlAnalysis } from "../contracts/urlTypes";

export function useUrlOracle(): UrlReputationOracle | null {
  const { address } = useWallet();
  return useMemo(() => {
    if (!URL_ORACLE_ADDRESS) return null;
    return new UrlReputationOracle(URL_ORACLE_ADDRESS, address);
  }, [address]);
}

export function useUrlHistory() {
  const [analyses, setAnalyses] = useState<LocalUrlAnalysis[]>([]);

  const refresh = useCallback(() => {
    setAnalyses(getAllUrlAnalyses());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { analyses, refresh };
}

export function useAnalyzeUrl() {
  const oracle = useUrlOracle();
  const { address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (url: string): Promise<LocalUrlAnalysis> => {
      if (!oracle) throw new Error("URL Oracle contract not configured.");
      if (!address) throw new Error("Connect your wallet first.");
      setIsSubmitting(true);
      setError(null);
      try {
        const txHash = await oracle.analyze(url);
        // Read back the stored verdict from the contract
        const record = await oracle.getReputation(url);
        if (!record.verdict) throw new Error("No verdict returned from oracle.");

        const entry: LocalUrlAnalysis = {
          id: `url-${Date.now()}`,
          url,
          txHash,
          verdict: record.verdict,
          analyzed_at: record.last_checked_at || new Date().toISOString(),
          owner: address,
        };
        storeUrlAnalysis(entry);
        return entry;
      } catch (err: any) {
        setError(err?.message || "Failed to analyze URL.");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [oracle, address]
  );

  return { submit, isSubmitting, error };
}
