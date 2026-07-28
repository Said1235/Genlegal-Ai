export const GITHUB_REPO_URL = "https://github.com/Said1235/Genlegal-Ai";
export const APP_VERSION = "1.25";

// Legal Contract Analyzer — deployed on StudioNet
export const GENLAYER_EXPLORER_BASE = "https://explorer-studio.genlayer.com";
export const CONTRACT_ONCHAIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xe5aF2DD10A78498FC629cEB9e2669CA0EEc17052";

// URL Reputation Oracle — deployed on StudioNet
export const URL_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_URL_ORACLE_ADDRESS || "0x9A8E0F1ec712A4C8A32E2bC0414eAfD2820c572f";

export function explorerTxUrl(txHash: string): string {
  return `${GENLAYER_EXPLORER_BASE}/tx/${txHash}`;
}
export function explorerContractUrl(address?: string): string {
  return `${GENLAYER_EXPLORER_BASE}/address/${address ?? CONTRACT_ONCHAIN_ADDRESS}`;
}
