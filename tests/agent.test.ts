import test from 'node:test';
import assert from 'node:assert/strict';

import { SpendingPolicy, SpendingLimitExceededError, ProtocolNotWhitelistedError, CircuitBreakerTrippedError } from '../src/security/SpendingPolicy.js';
import { IdempotencyGuard, DuplicateExecutionError } from '../src/security/IdempotencyGuard.js';
import { MultiHopperRouter, CircularRouteDetectedError } from '../src/routing/MultiHopperRouter.js';
import { OobeSapClient } from '../src/mcp/OobeSapClient.js';
import { AceDataCloudClient } from '../src/mcp/AceDataCloudClient.js';
import { SteveCapitalAgent } from '../src/core/SteveCapitalAgent.js';

test('SpendingPolicy: enforces per-transaction, daily limits, protocol whitelist, and circuit breaker', () => {
  const policy = new SpendingPolicy({
    maxSpendPerTxUsdc: 25.0,
    maxDailySpendUsdc: 50.0,
    maxDrawdownPct: 5.0,
    whitelistedProtocols: ['Kamino', 'Meteora', 'MultiHopper'],
    cooldownPeriodMs: 1000
  });

  // Valid spend
  assert.doesNotThrow(() => policy.validateTransaction(20.0, 'Kamino'));
  policy.recordSpend(20.0);
  assert.equal(policy.getRolling24hSpend(), 20.0);

  // Exceeds per-tx limit
  assert.throws(() => policy.validateTransaction(30.0, 'Kamino'), SpendingLimitExceededError);

  // Exceeds daily limit (20 + 35 > 50)
  assert.throws(() => policy.validateTransaction(35.0, 'Kamino'), SpendingLimitExceededError);

  // Protocol not whitelisted
  assert.throws(() => policy.validateTransaction(10.0, 'SuspiciousProtocol'), ProtocolNotWhitelistedError);

  // Circuit breaker
  policy.tripCircuitBreaker('High market volatility detected');
  assert.equal(policy.isHealthy(), false);
  assert.throws(() => policy.validateTransaction(5.0, 'Kamino'), CircuitBreakerTrippedError);

  policy.resetCircuitBreaker();
  assert.equal(policy.isHealthy(), true);
  assert.doesNotThrow(() => policy.validateTransaction(5.0, 'Kamino'));
});

test('IdempotencyGuard: prevents replay attacks and duplicate settlements', () => {
  const guard = new IdempotencyGuard();
  const payload = { action: 'swap', amount: 15.0, nonce: 'unique_123' };
  const hash = guard.computeHash(payload);

  assert.equal(guard.isExecuted(hash), false);

  // First intent registration succeeds
  assert.doesNotThrow(() => guard.registerIntent(hash));

  // Second intent registration for same payload throws DuplicateExecutionError
  assert.throws(() => guard.registerIntent(hash), DuplicateExecutionError);

  // Confirm execution
  guard.confirmExecution(hash, '5K...MockSig');
  assert.equal(guard.isExecuted(hash), true);
});

test('MultiHopperRouter: generates non-circular route and executes multi-hop settlement', async () => {
  const router = new MultiHopperRouter('https://api.mainnet-beta.solana.com', true);

  const route = router.findOptimalRoute('USDC', 'SOL', 20.0, 50);
  assert.equal(route.sourceToken, 'USDC');
  assert.equal(route.targetToken, 'SOL');
  assert.equal(route.isCircular, false);
  assert.ok(route.hops.length >= 1);

  // Circular route check
  assert.throws(() => router.findOptimalRoute('SOL', 'SOL', 1.0), CircularRouteDetectedError);

  // Execution
  const result = await router.executeRoute(route);
  assert.equal(result.success, true);
  assert.ok(result.txSignatures.length >= 1);
  assert.ok(result.executedAmountOut > 0);
});

test('OobeSapClient: correctly dispatches registered tool calls', async () => {
  const client = new OobeSapClient();

  assert.equal(client.isToolSupported('kamino_deposit'), true);
  assert.equal(client.isToolSupported('unregistered_tool'), false);

  const result = await client.executeTool({
    toolName: 'kamino_deposit',
    params: { pool: 'USDC-Main', amount: 20.0 }
  });

  assert.equal(result.success, true);
  assert.equal(result.toolName, 'kamino_deposit');
});

test('AceDataCloudClient: records qualifying paid service requests', async () => {
  const client = new AceDataCloudClient('test_api_key');

  assert.equal(client.getPaidRequestCount(), 0);

  const searchRes = await client.executeSearch('Top Solana Yield Opportunities');
  assert.equal(searchRes.status, 'completed');
  assert.equal(searchRes.creditsCharged, 1);

  const briefRes = await client.executeBriefing('DeFi Velocity Q4');
  assert.equal(briefRes.status, 'completed');
  assert.equal(briefRes.creditsCharged, 2);

  assert.equal(client.getPaidRequestCount(), 2);
});

test('SteveCapitalAgent: orchestrates autonomous rebalance with guardrails and telemetry', async () => {
  const agent = new SteveCapitalAgent({
    agentId: 'test-agent-01',
    agentName: 'Test Capital Agent',
    walletAddress: 'SolTestWallet11223344556677889900aabbccdd',
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    spendingPolicy: {
      maxSpendPerTxUsdc: 25.0,
      maxDailySpendUsdc: 100.0,
      maxDrawdownPct: 5.0,
      whitelistedProtocols: ['Kamino', 'Meteora', 'Orca', 'MultiHopper'],
      cooldownPeriodMs: 1000
    },
    dryRun: true
  });

  // Execute valid rebalance
  const result = await agent.executeRebalance('Orca', 'Kamino', 20.0);
  assert.equal(result.success, true);
  assert.ok(result.txSignatures.length >= 1);

  // Request intelligence
  await agent.requestMarketIntelligence('Meteora DLMM fee curves');

  // Telemetry check
  const telemetry = agent.getTelemetry();
  assert.equal(telemetry.totalVolumeRoutedUsdc, 20.0);
  assert.equal(telemetry.verifiedRoutesCount, 1);
  assert.equal(telemetry.aceDataPaidRequests, 1);
  assert.equal(telemetry.circuitBreakerHealthy, true);
});
