"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LegalContractAnalyzer from "../contracts/LegalContractAnalyzer";
import { getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/WalletProvider";
import type { Analysis, AnalyzerStats } from "../contracts/types";

export function useContract(): LegalContractAnalyzer | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();

  return useMemo(() => {
    if (!contractAddress) return null;
    return new LegalContractAnalyzer(contractAddress, address);
  }, [contractAddress, address]);
}

/** Polls get_stats() + get_all_analyses() and exposes a manual refetch. */
export function useDashboardData() {
  const contract = useContract();
  const [stats, setStats] = useState<AnalyzerStats | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!contract) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, all] = await Promise.all([contract.getStats(), contract.getAllAnalyses()]);
      setStats(s);
      setAnalyses(all.slice().reverse()); // newest first
    } catch (err: any) {
      setError(err?.message || "Failed to load contract data");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { stats, analyses, loading, error, refetch, contractConfigured: !!contract };
}

export function useMyAnalyses(ownerAddress: string | null) {
  const contract = useContract();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!contract || !ownerAddress) {
      setAnalyses([]);
      return;
    }
    setLoading(true);
    try {
      const mine = await contract.getMyAnalyses(ownerAddress);
      setAnalyses(mine.slice().reverse());
    } finally {
      setLoading(false);
    }
  }, [contract, ownerAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { analyses, loading, refetch };
}

export function useAnalyzeContract() {
  const contract = useContract();
  const { address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (title: string, contractType: string, text: string) => {
      if (!contract) throw new Error("Contract not configured - set NEXT_PUBLIC_CONTRACT_ADDRESS.");
      if (!address) throw new Error("Connect your wallet first.");
      setIsSubmitting(true);
      setError(null);
      try {
        const receipt = await contract.analyzeContract(title, contractType, text);
        return receipt;
      } catch (err: any) {
        setError(err?.message || "Failed to analyze contract");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [contract, address]
  );

  return { submit, isSubmitting, error };
}
