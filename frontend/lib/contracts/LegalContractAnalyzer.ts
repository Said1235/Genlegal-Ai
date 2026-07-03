import { createGenLayerClient } from "../genlayer/client";
import type { Analysis, AnalyzerStats, TransactionReceipt } from "./types";

/**
 * Thin typed wrapper around genlayer-js calls to the LegalContractAnalyzer
 * Intelligent Contract. Read methods (`@gl.public.view`) are free and
 * instant; `analyzeContract` is a `@gl.public.write` transaction that goes
 * through GenLayer's Optimistic Democracy consensus, so it returns only
 * once the network has accepted a result.
 */
class LegalContractAnalyzer {
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
   * Submit a contract for AI analysis. Waits for the transaction to be
   * ACCEPTED (consensus reached) before returning the receipt; the new
   * analysis id must then be read back via getAllAnalyses/getMyAnalyses
   * since GenLayer write calls return a transaction hash, not the
   * function's return value directly.
   */
  async analyzeContract(
    title: string,
    contractType: string,
    text: string
  ): Promise<TransactionReceipt> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "analyze_contract",
      args: [title, contractType, text],
      value: BigInt(0),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED",
      retries: 60,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }
}

export default LegalContractAnalyzer;
