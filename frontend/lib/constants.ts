export const GITHUB_REPO_URL = "https://github.com/Said1235/Genlegal-Ai";
export const APP_VERSION = "0.2.0";

// Must mirror MAX_CONTRACT_TEXT_CHARS in contracts/legal_contract_analyzer.py.
// The contract hard-rejects (UserError) any text longer than this, so the
// form has to enforce the same limit client-side instead of letting people
// paste more and only find out after the transaction reverts on-chain.
export const MAX_CONTRACT_TEXT_CHARS = 20_000;

// Confirmed working: https://explorer-studio.genlayer.com/address/0xAa40CA78E325531EFcB07767cF499a8aF702539D
export const GENLAYER_EXPLORER_BASE = "https://explorer-studio.genlayer.com";
// The deployed contract address on StudioNet (corrected redeploy - see
// contracts/legal_contract_analyzer.py header for the get_my_analyses
// input-validation and deterministic risk_level fixes applied here).
export const CONTRACT_ONCHAIN_ADDRESS = "0xAa40CA78E325531EFcB07767cF499a8aF702539D";

// Build an explorer URL for a tx hash or contract address
export function explorerTxUrl(txHash: string): string {
  return `${GENLAYER_EXPLORER_BASE}/tx/${txHash}`;
}
export function explorerContractUrl(): string {
  return `${GENLAYER_EXPLORER_BASE}/address/${CONTRACT_ONCHAIN_ADDRESS}`;
}
