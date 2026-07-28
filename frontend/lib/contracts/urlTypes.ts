/** Verdict returned by URLReputationOracle.analyze() and stored on-chain */
export interface UrlVerdict {
  risk_level: string;   // "safe" | "suspicious" | "malicious" | "unknown"
  is_phishing: boolean;
  is_malware: boolean;
  is_official: boolean;
  is_clone: boolean;
  is_scam_faucet: boolean;
  reputation_score: number;
  confidence: string;   // "0.0"–"1.0" as string (GenLayer calldata constraint)
  summary: string;
  fetch_error: boolean;
}

/** Full record returned by get_reputation() */
export interface UrlReputationRecord {
  url: string;
  status: "analyzed" | "error" | "unchecked";
  verdict: UrlVerdict | null;
  last_checked_at: string;
  last_requester: string;
}

/** Local cache entry — what we store after each analysis */
export interface LocalUrlAnalysis {
  id: string;           // uuid-like: `url-${Date.now()}`
  url: string;
  txHash: string;
  verdict: UrlVerdict;
  analyzed_at: string;  // ISO
  owner: string;        // wallet address
}
