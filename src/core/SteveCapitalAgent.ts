import { AgentConfig, MultiHopperExecutionResult } from '../types/index.js';
import { SpendingPolicy } from '../security/SpendingPolicy.js';
import { IdempotencyGuard } from '../security/IdempotencyGuard.js';
import { MultiHopperRouter } from '../routing/MultiHopperRouter.js';
import { OobeSapClient } from '../mcp/OobeSapClient.js';
import { AceDataCloudClient } from '../mcp/AceDataCloudClient.js';
import { AutonomousYieldRebalancer } from '../strategies/AutonomousYieldRebalancer.js';

export interface TelemetrySummary {
  agentId: string;
  walletAddress: string;
  cluster: string;
  totalVolumeRoutedUsdc: number;
  totalTransactionsExecuted: number;
  verifiedRoutesCount: number;
  aceDataPaidRequests: number;
  rolling24hSpendUsdc: number;
  circuitBreakerHealthy: boolean;
}

export class SteveCapitalAgent {
  public readonly config: AgentConfig;
  public readonly spendingPolicy: SpendingPolicy;
  public readonly idempotencyGuard: IdempotencyGuard;
  public readonly router: MultiHopperRouter;
  public readonly sapClient: OobeSapClient;
  public readonly aceClient: AceDataCloudClient;
  public readonly yieldRebalancer: AutonomousYieldRebalancer;

  private totalVolumeRoutedUsdc = 0;
  private totalTransactionsExecuted = 0;
  private verifiedRoutesCount = 0;

  constructor(config: AgentConfig) {
    this.config = config;
    this.spendingPolicy = new SpendingPolicy(config.spendingPolicy);
    this.idempotencyGuard = new IdempotencyGuard();
    this.router = new MultiHopperRouter(config.rpcUrl, config.dryRun ?? true);
    this.sapClient = new OobeSapClient();
    this.aceClient = new AceDataCloudClient();
    this.yieldRebalancer = new AutonomousYieldRebalancer(this.router);
  }

  public async executeRebalance(
    sourceProtocol: string,
    targetProtocol: string,
    amountUsdc: number
  ): Promise<MultiHopperExecutionResult> {
    // 1. Guardrail validation
    this.spendingPolicy.validateTransaction(amountUsdc, targetProtocol);

    // 2. Compute idempotency payload hash
    const payload = {
      action: 'rebalance',
      sourceProtocol,
      targetProtocol,
      amountUsdc,
      wallet: this.config.walletAddress,
      timestampMinute: Math.floor(Date.now() / 60000)
    };
    const payloadHash = this.idempotencyGuard.computeHash(payload);

    // 3. Register intent (prevents race-condition double execution)
    this.idempotencyGuard.registerIntent(payloadHash);

    try {
      // 4. Find optimal non-circular route via MultiHopper
      const route = this.router.findOptimalRoute('USDC', 'USDC', amountUsdc, 50, sourceProtocol, targetProtocol);

      // 5. Execute route
      const result = await this.router.executeRoute(route);

      if (result.success) {
        this.spendingPolicy.recordSpend(amountUsdc);
        this.idempotencyGuard.confirmExecution(payloadHash, result.txSignatures[0]);
        this.totalVolumeRoutedUsdc += amountUsdc;
        this.totalTransactionsExecuted += result.txSignatures.length;
        this.verifiedRoutesCount += 1;
      } else {
        this.idempotencyGuard.markFailed(payloadHash);
      }

      return result;
    } catch (error) {
      this.idempotencyGuard.markFailed(payloadHash);
      throw error;
    }
  }

  public async requestMarketIntelligence(query: string): Promise<void> {
    await this.aceClient.executeSearch(query);
  }

  public getTelemetry(): TelemetrySummary {
    return {
      agentId: this.config.agentId,
      walletAddress: this.config.walletAddress,
      cluster: this.config.cluster,
      totalVolumeRoutedUsdc: this.totalVolumeRoutedUsdc,
      totalTransactionsExecuted: this.totalTransactionsExecuted,
      verifiedRoutesCount: this.verifiedRoutesCount,
      aceDataPaidRequests: this.aceClient.getPaidRequestCount(),
      rolling24hSpendUsdc: this.spendingPolicy.getRolling24hSpend(),
      circuitBreakerHealthy: this.spendingPolicy.isHealthy()
    };
  }
}
