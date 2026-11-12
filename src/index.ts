export * from './types/index.js';
export * from './security/IdempotencyGuard.js';
export * from './security/SpendingPolicy.js';
export * from './routing/MultiHopperRouter.js';
export * from './mcp/OobeSapClient.js';
export * from './mcp/AceDataCloudClient.js';
export * from './strategies/AutonomousYieldRebalancer.js';
export * from './core/SteveCapitalAgent.js';

import { SteveCapitalAgent } from './core/SteveCapitalAgent.js';

async function main() {
  const isSimulate = process.argv.includes('--simulate');
  console.log(`[SteveCapitalAgent] Initializing Autonomous Capital Agent (Simulate: ${isSimulate})...`);

  const agent = new SteveCapitalAgent({
    agentId: 'steve-agent-solana-01',
    agentName: 'Sovereign Capital Optimizer',
    walletAddress: 'SolAgentWallet991188223344556677889900aabbccdd',
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    spendingPolicy: {
      maxSpendPerTxUsdc: 25.0,
      maxDailySpendUsdc: 100.0,
      maxDrawdownPct: 5.0,
      whitelistedProtocols: ['Kamino', 'Meteora', 'Orca', 'MultiHopper', 'Jupiter'],
      cooldownPeriodMs: 5000
    },
    dryRun: isSimulate
  });

  console.log('[SteveCapitalAgent] Agent online. Testing Ace Data Cloud MCP integration...');
  await agent.requestMarketIntelligence('Solana DeFi real-time yield spreads');
  console.log(`[SteveCapitalAgent] Ace Data Cloud paid requests recorded: ${agent.aceClient.getPaidRequestCount()}`);

  console.log('[SteveCapitalAgent] Executing non-circular MultiHopper yield rebalance route...');
  const result = await agent.executeRebalance('Orca', 'Kamino', 20.0);
  console.log('[SteveCapitalAgent] Execution result:', result);

  console.log('[SteveCapitalAgent] Final Telemetry:');
  console.table(agent.getTelemetry());
}

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  main().catch(err => {
    console.error('[SteveCapitalAgent] Fatal error:', err);
    process.exit(1);
  });
}
