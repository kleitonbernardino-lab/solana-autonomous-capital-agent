import { YieldOpportunity, RebalancePlan } from '../types/index.js';
import { MultiHopperRouter } from '../routing/MultiHopperRouter.js';

export class AutonomousYieldRebalancer {
  private readonly router: MultiHopperRouter;
  private readonly minSpreadThresholdBps: number;

  constructor(router: MultiHopperRouter, minSpreadThresholdBps = 150) {
    this.router = router;
    this.minSpreadThresholdBps = minSpreadThresholdBps;
  }

  public evaluateOpportunities(
    currentHoldings: { protocol: string; asset: string; amountUsdc: number },
    availablePools: YieldOpportunity[]
  ): RebalancePlan | null {
    const currentPool = availablePools.find(
      p => p.protocol.toLowerCase() === currentHoldings.protocol.toLowerCase() && p.asset === currentHoldings.asset
    );
    const currentApy = currentPool ? currentPool.currentApy : 0;

    // Find pool with highest risk-adjusted yield for the same asset
    let bestPool: YieldOpportunity | null = null;
    let maxApyDelta = 0;

    for (const pool of availablePools) {
      if (pool.asset === currentHoldings.asset && pool.protocol.toLowerCase() !== currentHoldings.protocol.toLowerCase()) {
        const delta = pool.currentApy - currentApy;
        if (delta > maxApyDelta) {
          maxApyDelta = delta;
          bestPool = pool;
        }
      }
    }

    const minDeltaRequired = this.minSpreadThresholdBps / 100; // e.g. 150 bps = 1.5% APY
    if (!bestPool || maxApyDelta < minDeltaRequired) {
      return null;
    }

    const rebalanceAmount = currentHoldings.amountUsdc;
    const route = this.router.findOptimalRoute(
      currentHoldings.asset,
      bestPool.asset,
      rebalanceAmount,
      50,
      currentHoldings.protocol,
      bestPool.protocol
    );

    const estimatedNetAnnualAlphaUsdc = (rebalanceAmount * (maxApyDelta / 100)) - route.totalEstimatedFeeUsdc;

    if (estimatedNetAnnualAlphaUsdc <= 0) {
      return null;
    }

    return {
      planId: `reb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceProtocol: currentHoldings.protocol,
      targetProtocol: bestPool.protocol,
      asset: currentHoldings.asset,
      rebalanceAmountUsdc: rebalanceAmount,
      projectedApyDelta: maxApyDelta,
      estimatedNetAnnualAlphaUsdc,
      route
    };
  }
}
