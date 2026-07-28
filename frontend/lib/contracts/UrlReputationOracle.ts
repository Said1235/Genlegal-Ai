import { createGenLayerClient } from "../genlayer/client";
import { URL_ORACLE_ADDRESS } from "../constants";
import type { UrlVerdict, UrlReputationRecord } from "./urlTypes";

class UrlReputationOracle {
  private contractAddress: `0x${string}`;
  private client: any;

  constructor(address?: string, walletAddress?: string | null) {
    this.contractAddress = (address || URL_ORACLE_ADDRESS) as `0x${string}`;
    this.client = createGenLayerClient(walletAddress);
  }

  updateAccount(address: string): void {
    this.client = createGenLayerClient(address);
  }

  /** Write — always runs a fresh analysis (costs gas) */
  async analyze(url: string): Promise<string> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "analyze",
      args: [url],
      value: BigInt(0),
    });

    // Wait for the transaction to be ACCEPTED by GenLayer consensus
    await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED",
      retries: 80,
      interval: 5000,
    });

    return txHash as string;
  }

  /** Read — free, no wallet needed */
  async getReputation(url: string): Promise<UrlReputationRecord> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_reputation",
      args: [url],
    });
    return result as UrlReputationRecord;
  }

  async getRiskLevel(url: string): Promise<string> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_risk_level",
      args: [url],
    });
    return result as string;
  }

  async isFlagged(url: string): Promise<boolean> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "is_flagged",
      args: [url],
    });
    return result as boolean;
  }

  async getStats(): Promise<{ total_analyses: string }> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_stats",
      args: [],
    });
    return result as { total_analyses: string };
  }
}

export default UrlReputationOracle;
