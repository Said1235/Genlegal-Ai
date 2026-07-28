"use client";

import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import type { Analysis } from "./contracts/types";
import type { LocalUrlAnalysis } from "./contracts/urlTypes";

export interface ContractResultData {
  analysis: Analysis;
  txHash: string;
  contractHash: string;
  contractText: string;
}

export type ContractView = "form" | "analyzing" | "results";
export type UrlView = "form" | "analyzing" | "results";

interface ContractCtx {
  view: ContractView; result: ContractResultData | null; statusText: string;
  setView: (v: ContractView) => void; setResult: (r: ContractResultData | null) => void;
  setStatusText: (s: string) => void; reset: () => void;
}
interface UrlCtx {
  view: UrlView; result: LocalUrlAnalysis | null; statusText: string;
  setView: (v: UrlView) => void; setResult: (r: LocalUrlAnalysis | null) => void;
  setStatusText: (s: string) => void; reset: () => void;
}

const ContractContext = createContext<ContractCtx | undefined>(undefined);
const UrlContext = createContext<UrlCtx | undefined>(undefined);

export function AnalysisStateProvider({ children }: { children: ReactNode }) {
  const [cView, setCView] = useState<ContractView>("form");
  const [cResult, setCResult] = useState<ContractResultData | null>(null);
  const [cStatus, setCStatus] = useState("Sending transaction...");
  const [uView, setUView] = useState<UrlView>("form");
  const [uResult, setUResult] = useState<LocalUrlAnalysis | null>(null);
  const [uStatus, setUStatus] = useState("Sending transaction...");

  const contractCtx: ContractCtx = {
    view: cView, result: cResult, statusText: cStatus,
    setView: setCView, setResult: setCResult, setStatusText: setCStatus,
    reset: useCallback(() => { setCView("form"); setCResult(null); setCStatus("Sending transaction..."); }, []),
  };
  const urlCtx: UrlCtx = {
    view: uView, result: uResult, statusText: uStatus,
    setView: setUView, setResult: setUResult, setStatusText: setUStatus,
    reset: useCallback(() => { setUView("form"); setUResult(null); setUStatus("Sending transaction..."); }, []),
  };

  return (
    <ContractContext.Provider value={contractCtx}>
      <UrlContext.Provider value={urlCtx}>{children}</UrlContext.Provider>
    </ContractContext.Provider>
  );
}

export function useContractAnalysis(): ContractCtx {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContractAnalysis must be inside AnalysisStateProvider");
  return ctx;
}
export function useUrlAnalysis(): UrlCtx {
  const ctx = useContext(UrlContext);
  if (!ctx) throw new Error("useUrlAnalysis must be inside AnalysisStateProvider");
  return ctx;
}
