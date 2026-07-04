export const GITHUB_REPO_URL = "https://github.com/Said1235/Genlegal-Ai";
export const APP_VERSION = "0.2.0";

// Confirmed working: https://explorer-studio.genlayer.com/address/0xe5aF2DD10A78498FC629cEB9e2669CA0EEc17052
export const GENLAYER_EXPLORER_BASE = "https://explorer-studio.genlayer.com";
// The deployed contract address on StudioNet
export const CONTRACT_ONCHAIN_ADDRESS = "0xe5aF2DD10A78498FC629cEB9e2669CA0EEc17052";

// Build an explorer URL for a tx hash or contract address
export function explorerTxUrl(txHash: string): string {
  return `${GENLAYER_EXPLORER_BASE}/tx/${txHash}`;
}
export function explorerContractUrl(): string {
  return `${GENLAYER_EXPLORER_BASE}/address/${CONTRACT_ONCHAIN_ADDRESS}`;
}
