/** Mirrors the dict shape returned by SmartContractAuditor's view methods
 * (see contracts/smart_contract_auditor.py::_audit_to_dict). */
export interface Analysis {
  id: string;
  owner: string;
  title: string;
  language: string;
  risk_level: "Low" | "Medium" | "High";
  risk_score: number;
  summary: string;
  recommendations: string[];
  risks: string[];
  created_at: string;
}

/** Mirrors get_stats() */
export interface AnalyzerStats {
  total_analyses: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  [key: string]: any;
}
