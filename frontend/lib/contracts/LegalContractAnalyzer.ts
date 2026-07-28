import { createGenLayerClient } from "../genlayer/client";
import type { Analysis, AnalyzerStats } from "./types";

// Must match the contract constant MAX_CONTRACT_TEXT_CHARS = 20_000
export const CONTRACT_MAX_CHARS = 20_000;

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
   * Submits a legal document for AI analysis and returns the EXACT analysis
   * record that was created — identified by reading total_analyses (= next_id)
   * BEFORE the transaction, so we know which ID to read back afterwards.
   * This avoids the unreliable "take the last item in the global list" pattern.
   */
  async analyzeContractAndRead(
    title: string,
    contractType: string,
    text: string
  ): Promise<{ txHash: string; analysis: Analysis }> {
    // The contract assigns IDs as str(next_id) starting at 0.
    // total_analyses == current count == value of next_id before this tx.
    const statsBefore = await this.getStats();
    const expectedId = String(statsBefore.total_analyses);

    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "analyze_contract",
      args: [title, contractType, text],
      value: BigInt(0),
    });

    await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED",
      retries: 80,
      interval: 5000,
    });

    // Read the exact record created by this transaction
    const analysis = await this.getAnalysis(expectedId);
    return { txHash: txHash as string, analysis };
  }
}

export default LegalContractAnalyzer;
