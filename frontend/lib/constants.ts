export const GITHUB_REPO_URL = "https://github.com/Said1235/Genlegal-Ai";
export const APP_VERSION = "0.3.0";

// Must mirror MAX_CODE_CHARS in contracts/smart_contract_auditor.py.
// The contract hard-rejects (UserError) any code longer than this, so the
// form has to enforce the same limit client-side instead of letting people
// paste more and only find out after the transaction reverts on-chain.
export const MAX_CONTRACT_TEXT_CHARS = 20_000;

export const GENLAYER_EXPLORER_BASE = "https://explorer-studio.genlayer.com";
// The deployed SmartContractAuditor contract address on StudioNet.
export const CONTRACT_ONCHAIN_ADDRESS = "0xc43D669Ae027CbF37Ee21Ab31038D152313E7605";

// Build an explorer URL for a tx hash or contract address
export function explorerTxUrl(txHash: string): string {
  return `${GENLAYER_EXPLORER_BASE}/tx/${txHash}`;
}
export function explorerContractUrl(): string {
  return `${GENLAYER_EXPLORER_BASE}/address/${CONTRACT_ONCHAIN_ADDRESS}`;
}
