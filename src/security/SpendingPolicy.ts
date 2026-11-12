import { SpendingPolicyConfig } from '../types/index.js';

export class SpendingLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpendingLimitExceededError';
  }
}

export class ProtocolNotWhitelistedError extends Error {
  constructor(protocol: string) {
    super(`Protocol ${protocol} is not in the agent whitelist`);
    this.name = 'ProtocolNotWhitelistedError';
  }
}

export class CircuitBreakerTrippedError extends Error {
  constructor(reason: string) {
    super(`Agent circuit breaker is active. Reason: ${reason}`);
    this.name = 'CircuitBreakerTrippedError';
  }
}

interface SpendEntry {
  amountUsdc: number;
  timestamp: number;
}

export class SpendingPolicy {
  private readonly config: SpendingPolicyConfig;
  private readonly spendHistory: SpendEntry[] = [];
  private circuitBreakerActive = false;
  private circuitBreakerReason = '';

  constructor(config: SpendingPolicyConfig) {
    this.config = config;
  }

  public validateTransaction(amountUsdc: number, protocol: string): void {
    if (this.circuitBreakerActive) {
      throw new CircuitBreakerTrippedError(this.circuitBreakerReason);
    }

    if (!this.config.whitelistedProtocols.map(p => p.toLowerCase()).includes(protocol.toLowerCase())) {
      throw new ProtocolNotWhitelistedError(protocol);
    }

    if (amountUsdc > this.config.maxSpendPerTxUsdc) {
      throw new SpendingLimitExceededError(
        `Requested spend ${amountUsdc} USDC exceeds per-tx limit of ${this.config.maxSpendPerTxUsdc} USDC`
      );
    }

    const currentDailySpend = this.getRolling24hSpend();
    if (currentDailySpend + amountUsdc > this.config.maxDailySpendUsdc) {
      throw new SpendingLimitExceededError(
        `Requested spend would push daily total to ${currentDailySpend + amountUsdc} USDC, exceeding limit of ${this.config.maxDailySpendUsdc} USDC`
      );
    }
  }

  public recordSpend(amountUsdc: number): void {
    this.spendHistory.push({
      amountUsdc,
      timestamp: Date.now()
    });
  }

  public getRolling24hSpend(): number {
    const oneDayAgo = Date.now() - 24 * 3600_000;
    return this.spendHistory
      .filter(entry => entry.timestamp >= oneDayAgo)
      .reduce((sum, entry) => sum + entry.amountUsdc, 0);
  }

  public tripCircuitBreaker(reason: string): void {
    this.circuitBreakerActive = true;
    this.circuitBreakerReason = reason;
  }

  public resetCircuitBreaker(): void {
    this.circuitBreakerActive = false;
    this.circuitBreakerReason = '';
  }

  public isHealthy(): boolean {
    return !this.circuitBreakerActive;
  }
}
