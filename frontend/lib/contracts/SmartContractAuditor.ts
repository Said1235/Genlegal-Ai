import { createGenLayerClient } from "../genlayer/client";
import type { Analysis, AnalyzerStats, TransactionReceipt } from "./types";

/**
 * Thin typed wrapper around genlayer-js calls to the SmartContractAuditor
 * Intelligent Contract. Read methods (`@gl.public.view`) are free and
 * instant; `analyzeContract` is a `@gl.public.write` transaction that goes
 * through GenLayer's Optimistic Democracy consensus, so it returns only
 * once the network has accepted a result.
 */
class SmartContractAuditor {
  private contractAddress: `0x${string}`;
  private client: any;

  constructor(contractAddress: string, address?: string | null) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.client = createGenLayerClient(address);
  }

  updateAccount(address: string): void {
    this.client = createGenLayerClient(address);
  }

  async getStats(): Promise<AnalyzerStats> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_stats",
      args: [],
    });
    return result as AnalyzerStats;
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_all_analyses",
      args: [],
    });
    return (result as Analysis[]) ?? [];
  }

  async getMyAnalyses(ownerAddress: string): Promise<Analysis[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_my_analyses",
      args: [ownerAddress],
    });
    return (result as Analysis[]) ?? [];
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_analysis",
      args: [id],
    });
    return result as Analysis;
  }

  /**
   * Extract the id that analyze_contract() returned, straight from the
   * transaction's own decoded return value - not from any list-diffing
   * heuristic, which can't tell two overlapping submissions from the same
   * wallet apart and isn't tied to this specific receipt at all.
   *
   * On Studio-family networks (isStudio: true - includes studionet, which
   * this app targets by default), genlayer-js decodes a successful write's
   * return value into
   *   receipt.consensus_data.leader_receipt[0].result.payload.readable
   * as a JSON-encoded string (Python `str` -> JSON.stringify'd), e.g. the
   * literal 4-character string '"0"' for an id of "0". JSON.parse() on that
   * readable string gives back the raw id directly. Returns null (never a
   * guess) if the shape isn't what's expected, so the caller can fail
   * honestly instead of silently pointing at the wrong record.
   */
  private extractReturnedId(receipt: any): string | null {
    try {
      const leaderReceipt = receipt?.consensus_data?.leader_receipt;
      const first = Array.isArray(leaderReceipt) ? leaderReceipt[0] : leaderReceipt;
      const result = first?.result;
      if (!result || result.status !== "return") return null;
      const readable = result.payload?.readable;
      if (typeof readable !== "string") return null;
      const parsed = JSON.parse(readable);
      return typeof parsed === "string" ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Submit smart contract source code for AI security audit. Waits for the
   * transaction to be ACCEPTED (consensus reached), then returns both the
   * receipt and the exact analysis id parsed from that receipt's own
   * return value (see extractReturnedId) - `analysisId` is null only if
   * the decode genuinely failed, in which case the caller must not guess
   * which record this transaction created.
   */
  async analyzeContract(
    title: string,
    language: string,
    code: string
  ): Promise<{ receipt: TransactionReceipt; analysisId: string | null }> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "analyze_contract",
      args: [title, language, code],
      value: BigInt(0),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED",
      retries: 60,
      interval: 5000,
    });

    return {
      receipt: receipt as TransactionReceipt,
      analysisId: this.extractReturnedId(receipt),
    };
  }
}

export default SmartContractAuditor;
