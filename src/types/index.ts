export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

export interface SpendingPolicyConfig {
  maxSpendPerTxUsdc: number;
  maxDailySpendUsdc: number;
  maxDrawdownPct: number;
  whitelistedProtocols: string[];
  cooldownPeriodMs: number;
}

export interface AgentConfig {
  agentId: string;
  agentName: string;
  walletAddress: string;
  cluster: SolanaCluster;
  rpcUrl: string;
  spendingPolicy: SpendingPolicyConfig;
  dryRun?: boolean;
}

export interface RouteHop {
  hopIndex: number;
  sourceToken: string;
  destinationToken: string;
  dexProtocol: 'jupiter' | 'orca' | 'raydium' | 'meteora' | 'multihopper';
  poolId?: string;
  amountIn: number;
  expectedOut: number;
  minOut: number;
  estimatedFeeLamports: number;
}

export interface MultiHopperRoute {
  routeId: string;
  sourceToken: string;
  targetToken: string;
  amountIn: number;
  expectedAmountOut: number;
  hops: RouteHop[];
  slippageToleranceBps: number;
  isCircular: boolean;
  totalEstimatedFeeUsdc: number;
}

export interface MultiHopperExecutionResult {
  routeId: string;
  success: boolean;
  txSignatures: string[];
  totalFeesUsdc: number;
  executedAmountOut: number;
  latencyMs: number;
  timestamp: string;
  error?: string;
}

export interface IdempotencyRecord {
  payloadHash: string;
  txSignature: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export interface OobeSapToolCall {
  toolName: string;
  params: Record<string, unknown>;
  executionTimeoutMs?: number;
}

export interface OobeSapToolResult {
  success: boolean;
  toolName: string;
  output: unknown;
  executionTimeMs: number;
  error?: string;
}

export interface AceDataServiceRequest {
  serviceType: 'search' | 'briefing' | 'sentiment' | 'video' | 'voice';
  query: string;
  creditsCharged: number;
  requestId: string;
  status: 'completed' | 'failed';
  result?: unknown;
}

export interface YieldOpportunity {
  protocol: string;
  asset: string;
  currentApy: number;
  tvlUsdc: number;
  liquidityDepthUsdc: number;
  riskScore: number; // 0 to 1
}

export interface RebalancePlan {
  planId: string;
  sourceProtocol: string;
  targetProtocol: string;
  asset: string;
  rebalanceAmountUsdc: number;
  projectedApyDelta: number;
  estimatedNetAnnualAlphaUsdc: number;
  route: MultiHopperRoute;
}
