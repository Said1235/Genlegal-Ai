export function formatAddress(address: string | null, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export type RiskLevel = "Low" | "Medium" | "High";

export const riskColor: Record<RiskLevel, string> = {
  High: "#f43f5e",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

export const riskTextClass: Record<RiskLevel, string> = {
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-emerald-400",
};

export const riskBadgeClass: Record<RiskLevel, string> = {
  High: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
  Medium: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
  Low: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
};

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** SHA-256 of the analyzed text, computed entirely client-side via the
 * browser's native Web Crypto API (no extra dependency). This is the
 * "Contract Hash" shown in results - a fingerprint of what was analyzed,
 * not something stored on-chain (the contract itself has no notion of its
 * own transaction hash from inside its own execution). */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function truncateHash(hash: string, chars = 10): string {
  if (!hash) return "";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type DateFilter = "today" | "week" | "month" | "all";

export function isWithinDateFilter(iso: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const date = new Date(iso).getTime();
  const now = Date.now();
  const DAY = 86_400_000;
  if (filter === "today") return now - date < DAY;
  if (filter === "week") return now - date < DAY * 7;
  if (filter === "month") return now - date < DAY * 30;
  return true;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
